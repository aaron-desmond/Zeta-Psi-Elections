const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Get all applications
exports.getAllApplications = (req, res) => {
    const query = `
        SELECT a.*, 
               u.first_name, u.last_name, u.email,
               p.title as position_title,
               GROUP_CONCAT(at.term, '|||') as terms
        FROM applications a
        JOIN users u ON a.user_id = u.id
        JOIN positions p ON a.position_id = p.id
        LEFT JOIN application_terms at ON a.id = at.application_id
        GROUP BY a.id
        ORDER BY a.submitted_at DESC
    `;

    db.all(query, [], (err, applications) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch applications',
                error: err.message
            });
        }

        const formatted = applications.map(app => ({
            id: app.id,
            userId: app.user_id,
            positionId: app.position_id,
            firstName: app.first_name,
            lastName: app.last_name,
            email: app.email,
            position: app.position_title,
            photoPath: app.photo_path,
            statement: app.statement,
            terms: app.terms ? app.terms.split('|||') : [],
            submittedAt: app.submitted_at
        }));

        res.json({
            success: true,
            applications: formatted
        });
    });
};

// Get applications by position
exports.getApplicationsByPosition = (req, res) => {
    const { positionId } = req.params;

    const query = `
        SELECT a.*, 
               u.first_name, u.last_name, u.email,
               p.title as position_title,
               GROUP_CONCAT(at.term, '|||') as terms
        FROM applications a
        JOIN users u ON a.user_id = u.id
        JOIN positions p ON a.position_id = p.id
        LEFT JOIN application_terms at ON a.id = at.application_id
        WHERE a.position_id = ?
        GROUP BY a.id
        ORDER BY a.submitted_at DESC
    `;

    db.all(query, [positionId], (err, applications) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch applications',
                error: err.message
            });
        }

        const formatted = applications.map(app => ({
            id: app.id,
            userId: app.user_id,
            positionId: app.position_id,
            firstName: app.first_name,
            lastName: app.last_name,
            email: app.email,
            position: app.position_title,
            photoPath: app.photo_path,
            statement: app.statement,
            terms: app.terms ? app.terms.split('|||') : [],
            submittedAt: app.submitted_at
        }));

        res.json({
            success: true,
            applications: formatted
        });
    });
};

// Get user's applications
exports.getMyApplications = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT a.*, 
               p.title as position_title,
               GROUP_CONCAT(at.term, '|||') as terms
        FROM applications a
        JOIN positions p ON a.position_id = p.id
        LEFT JOIN application_terms at ON a.id = at.application_id
        WHERE a.user_id = ?
        GROUP BY a.id
        ORDER BY a.submitted_at DESC
    `;

    db.all(query, [userId], (err, applications) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch applications',
                error: err.message
            });
        }

        const formatted = applications.map(app => ({
            id: app.id,
            positionId: app.position_id,
            position: app.position_title,
            photoPath: app.photo_path,
            statement: app.statement,
            terms: app.terms ? app.terms.split('|||') : [],
            submittedAt: app.submitted_at
        }));

        res.json({
            success: true,
            applications: formatted
        });
    });
};

// Submit application
exports.submitApplication = (req, res) => {
    const userId = req.user.id;
    const { positionId, statement, terms } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!positionId || !statement || !terms || terms.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Position, statement, and at least one term are required'
        });
    }

    // Check if user already applied for this position
    db.get(
        'SELECT id FROM applications WHERE user_id = ? AND position_id = ?',
        [userId, positionId],
        (err, existing) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already applied for this position'
                });
            }

            // Insert application
            const query = `
                INSERT INTO applications (user_id, position_id, photo_path, statement)
                VALUES (?, ?, ?, ?)
            `;

            db.run(query, [userId, positionId, photoPath, statement], function(err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to submit application',
                        error: err.message
                    });
                }

                const applicationId = this.lastID;

                // Insert terms
                const termQuery = `INSERT INTO application_terms (application_id, term) VALUES (?, ?)`;
                const stmt = db.prepare(termQuery);

                terms.forEach(term => {
                    stmt.run([applicationId, term]);
                });

                stmt.finalize();

                res.status(201).json({
                    success: true,
                    message: 'Application submitted successfully',
                    application: {
                        id: applicationId,
                        positionId,
                        photoPath,
                        statement,
                        terms
                    }
                });
            });
        }
    );
};

// Update application
exports.updateApplication = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { statement, terms } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    // Check if application belongs to user
    db.get('SELECT * FROM applications WHERE id = ? AND user_id = ?', [id, userId], (err, application) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found or unauthorized'
            });
        }

        // Update application
        let query, params;
        
        if (photoPath) {
            // Delete old photo if exists
            if (application.photo_path) {
                const oldPhotoPath = path.join(__dirname, '..', application.photo_path);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }
            
            query = 'UPDATE applications SET statement = ?, photo_path = ? WHERE id = ?';
            params = [statement, photoPath, id];
        } else {
            query = 'UPDATE applications SET statement = ? WHERE id = ?';
            params = [statement, id];
        }

        db.run(query, params, function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update application',
                    error: err.message
                });
            }

            // Update terms
            db.run('DELETE FROM application_terms WHERE application_id = ?', [id], (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update terms',
                        error: err.message
                    });
                }

                // Insert new terms
                if (terms && terms.length > 0) {
                    const termQuery = `INSERT INTO application_terms (application_id, term) VALUES (?, ?)`;
                    const stmt = db.prepare(termQuery);

                    terms.forEach(term => {
                        stmt.run([id, term]);
                    });

                    stmt.finalize();
                }

                res.json({
                    success: true,
                    message: 'Application updated successfully',
                    application: {
                        id: parseInt(id),
                        statement,
                        photoPath: photoPath || application.photo_path,
                        terms: terms || []
                    }
                });
            });
        });
    });
};

// Delete application
exports.deleteApplication = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if application belongs to user
    db.get('SELECT * FROM applications WHERE id = ? AND user_id = ?', [id, userId], (err, application) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found or unauthorized'
            });
        }

        // Delete photo if exists
        if (application.photo_path) {
            const photoPath = path.join(__dirname, '..', application.photo_path);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        // Delete application (cascade will delete terms)
        db.run('DELETE FROM applications WHERE id = ?', [id], function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete application',
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: 'Application deleted successfully'
            });
        });
    });
};
// Create floor nomination (Admin only)
exports.createFloorNomination = (req, res) => {
    const { positionId, firstName, lastName, statement } = req.body;

    if (!positionId || !firstName || !lastName) {
        return res.status(400).json({
            success: false,
            message: 'Position ID, first name, and last name are required'
        });
    }

    // Verify position exists
    db.get('SELECT id FROM positions WHERE id = ?', [positionId], (err, position) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!position) {
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        // Create a floor nomination user entry
        // Floor nominations don't have real user accounts - use special email format
        const email = `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@floor.nomination`;
        const password = 'FLOOR_NOMINATION_NO_LOGIN';

        db.run(
            'INSERT INTO users (email, password, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, 0)',
            [email, password, firstName, lastName],
            function(err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create nomination user',
                        error: err.message
                    });
                }

                const userId = this.lastID;

                // Create application
                const finalStatement = statement || `Floor nomination for ${firstName} ${lastName}`;

                db.run(
                    'INSERT INTO applications (user_id, position_id, statement, photo_path) VALUES (?, ?, ?, NULL)',
                    [userId, positionId, finalStatement],
                    function(err) {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to create application',
                                error: err.message
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Floor nomination created successfully',
                            application: {
                                id: this.lastID,
                                userId,
                                positionId,
                                firstName,
                                lastName,
                                statement: finalStatement,
                                isFloorNomination: true
                            }
                        });
                    }
                );
            }
        );
    });
};