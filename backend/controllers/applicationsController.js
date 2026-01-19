const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// Get all applications
exports.getAllApplications = async (req, res) => {
    try {
        const query = `
            SELECT a.*, 
                   u.first_name, u.last_name, u.email,
                   p.title as position_title,
                   STRING_AGG(at.term, '|||') as terms
            FROM applications a
            JOIN users u ON a.user_id = u.id
            JOIN positions p ON a.position_id = p.id
            LEFT JOIN application_terms at ON a.id = at.application_id
            GROUP BY a.id, u.first_name, u.last_name, u.email, p.title
            ORDER BY a.submitted_at DESC
        `;

        const result = await pool.query(query);
        const applications = result.rows;

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
    } catch (error) {
        console.error('Get all applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// Get applications by position
exports.getApplicationsByPosition = async (req, res) => {
    try {
        const { positionId } = req.params;

        const query = `
            SELECT a.*, 
                   u.first_name, u.last_name, u.email,
                   STRING_AGG(at.term, '|||') as terms
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN application_terms at ON a.id = at.application_id
            WHERE a.position_id = $1
            GROUP BY a.id, u.first_name, u.last_name, u.email
            ORDER BY a.submitted_at DESC
        `;

        const result = await pool.query(query, [positionId]);
        const applications = result.rows;

        const formatted = applications.map(app => ({
            id: app.id,
            userId: app.user_id,
            positionId: app.position_id,
            firstName: app.first_name,
            lastName: app.last_name,
            email: app.email,
            photoPath: app.photo_path,
            statement: app.statement,
            terms: app.terms ? app.terms.split('|||') : [],
            submittedAt: app.submitted_at
        }));

        res.json({
            success: true,
            applications: formatted
        });
    } catch (error) {
        console.error('Get applications by position error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// Get my applications (current user)
exports.getMyApplications = async (req, res) => {
    try {
        const userId = req.user.id;

        const query = `
            SELECT a.*, 
                   p.title as position_title,
                   STRING_AGG(at.term, '|||') as terms
            FROM applications a
            JOIN positions p ON a.position_id = p.id
            LEFT JOIN application_terms at ON a.id = at.application_id
            WHERE a.user_id = $1
            GROUP BY a.id, p.title
            ORDER BY a.submitted_at DESC
        `;

        const result = await pool.query(query, [userId]);
        const applications = result.rows;

        const formatted = applications.map(app => ({
            id: app.id,
            positionId: app.position_id,
            positionTitle: app.position_title,
            photoPath: app.photo_path,
            statement: app.statement,
            terms: app.terms ? app.terms.split('|||') : [],
            submittedAt: app.submitted_at
        }));

        res.json({
            success: true,
            applications: formatted
        });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message
        });
    }
};

// Submit application
exports.submitApplication = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const userId = req.user.id;
        const { positionId, statement, terms } = req.body;
        const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!positionId || !statement) {
            return res.status(400).json({
                success: false,
                message: 'Position and statement are required'
            });
        }

        await client.query('BEGIN');

        // Check if user already applied for this position
        const checkQuery = 'SELECT id FROM applications WHERE user_id = $1 AND position_id = $2';
        const checkResult = await client.query(checkQuery, [userId, positionId]);

        if (checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this position'
            });
        }

        // Insert application
        const insertQuery = `
            INSERT INTO applications (user_id, position_id, photo_path, statement)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const insertResult = await client.query(insertQuery, [userId, positionId, photoPath, statement]);
        const application = insertResult.rows[0];

        // Insert terms if provided
        if (terms && Array.isArray(terms) && terms.length > 0) {
            const termsQuery = 'INSERT INTO application_terms (application_id, term) VALUES ($1, $2)';
            
            for (const term of terms) {
                if (term && term.trim()) {
                    await client.query(termsQuery, [application.id, term.trim()]);
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: {
                id: application.id,
                positionId: application.position_id,
                photoPath: application.photo_path,
                statement: application.statement,
                terms: terms || [],
                submittedAt: application.submitted_at
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Submit application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit application',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Update application
exports.updateApplication = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { statement, terms } = req.body;
        const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

        if (!statement) {
            return res.status(400).json({
                success: false,
                message: 'Statement is required'
            });
        }

        await client.query('BEGIN');

        // Check if application exists and belongs to user
        const checkQuery = 'SELECT * FROM applications WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);
        const application = checkResult.rows[0];

        if (!application) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Only allow user to update their own application (unless admin)
        if (application.user_id !== userId && !req.user.isAdmin) {
            await client.query('ROLLBACK');
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this application'
            });
        }

        // Update application
        const updateQuery = photoPath
            ? 'UPDATE applications SET statement = $1, photo_path = $2 WHERE id = $3 RETURNING *'
            : 'UPDATE applications SET statement = $1 WHERE id = $2 RETURNING *';

        const updateParams = photoPath ? [statement, photoPath, id] : [statement, id];
        const updateResult = await client.query(updateQuery, updateParams);
        const updatedApplication = updateResult.rows[0];

        // Delete old photo if new photo provided
        if (photoPath && application.photo_path) {
            const oldPhotoPath = path.join(__dirname, '..', application.photo_path);
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        // Update terms if provided
        if (terms && Array.isArray(terms)) {
            // Delete old terms
            await client.query('DELETE FROM application_terms WHERE application_id = $1', [id]);

            // Insert new terms
            if (terms.length > 0) {
                const termsQuery = 'INSERT INTO application_terms (application_id, term) VALUES ($1, $2)';
                
                for (const term of terms) {
                    if (term && term.trim()) {
                        await client.query(termsQuery, [id, term.trim()]);
                    }
                }
            }
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Application updated successfully',
            application: {
                id: updatedApplication.id,
                positionId: updatedApplication.position_id,
                photoPath: updatedApplication.photo_path,
                statement: updatedApplication.statement,
                terms: terms || [],
                submittedAt: updatedApplication.submitted_at
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Delete application
exports.deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if application exists and belongs to user
        const checkQuery = 'SELECT * FROM applications WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [id]);
        const application = checkResult.rows[0];

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Only allow user to delete their own application (unless admin)
        if (application.user_id !== userId && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this application'
            });
        }

        // Delete application (cascade will delete terms)
        const deleteQuery = 'DELETE FROM applications WHERE id = $1';
        await pool.query(deleteQuery, [id]);

        // Delete photo if exists
        if (application.photo_path) {
            const photoPath = path.join(__dirname, '..', application.photo_path);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        res.json({
            success: true,
            message: 'Application deleted successfully'
        });
    } catch (error) {
        console.error('Delete application error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete application',
            error: error.message
        });
    }
};

// Create floor nomination (Admin only)
exports.createFloorNomination = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { positionId, firstName, lastName, statement } = req.body;

        if (!positionId || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Position ID, first name, and last name are required'
            });
        }

        await client.query('BEGIN');

        // Verify position exists
        const posQuery = 'SELECT id FROM positions WHERE id = $1';
        const posResult = await client.query(posQuery, [positionId]);

        if (posResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        // Create a floor nomination user entry
        const email = `floor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@floor.nomination`;
        const password = 'FLOOR_NOMINATION_NO_LOGIN';

        const userQuery = 'INSERT INTO users (email, password, first_name, last_name, is_admin) VALUES ($1, $2, $3, $4, 0) RETURNING id';
        const userResult = await client.query(userQuery, [email, password, firstName, lastName]);
        const userId = userResult.rows[0].id;

        // Create application
        const finalStatement = statement || `Floor nomination for ${firstName} ${lastName}`;
        const appQuery = 'INSERT INTO applications (user_id, position_id, statement, photo_path) VALUES ($1, $2, $3, NULL) RETURNING *';
        const appResult = await client.query(appQuery, [userId, positionId, finalStatement]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Floor nomination created successfully',
            application: {
                id: appResult.rows[0].id,
                userId,
                positionId,
                firstName,
                lastName,
                statement: finalStatement,
                isFloorNomination: true
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create floor nomination error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create floor nomination',
            error: error.message
        });
    } finally {
        client.release();
    }
};