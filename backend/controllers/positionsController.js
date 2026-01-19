const db = require('../config/database');

// Get all positions
exports.getAllPositions = (req, res) => {
    const query = `
        SELECT p.*, 
               GROUP_CONCAT(pr.responsibility, '|||') as responsibilities
        FROM positions p
        LEFT JOIN position_responsibilities pr ON p.id = pr.position_id
        GROUP BY p.id
        ORDER BY p.is_executive DESC, p.title ASC
    `;

    db.all(query, [], (err, positions) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch positions',
                error: err.message
            });
        }

        // Format responsibilities
        const formattedPositions = positions.map(pos => ({
            id: pos.id,
            title: pos.title,
            description: pos.description,
            isExecutive: pos.is_executive === 1,
            numberOfPositions: pos.number_of_positions,
            responsibilities: pos.responsibilities 
                ? pos.responsibilities.split('|||').filter(Boolean)
                : []
        }));

        res.json({
            success: true,
            positions: formattedPositions
        });
    });
};

// Get single position
exports.getPosition = (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT p.*, 
               GROUP_CONCAT(pr.responsibility, '|||') as responsibilities
        FROM positions p
        LEFT JOIN position_responsibilities pr ON p.id = pr.position_id
        WHERE p.id = ?
        GROUP BY p.id
    `;

    db.get(query, [id], (err, position) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch position',
                error: err.message
            });
        }

        if (!position) {
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        res.json({
            success: true,
            position: {
                id: position.id,
                title: position.title,
                description: position.description,
                isExecutive: position.is_executive === 1,
                numberOfPositions: position.number_of_positions,
                responsibilities: position.responsibilities 
                    ? position.responsibilities.split('|||').filter(Boolean)
                    : []
            }
        });
    });
};

// Create position (admin only)
exports.createPosition = (req, res) => {
    const { title, description, isExecutive, numberOfPositions, responsibilities } = req.body;

    if (!title || !description) {
        return res.status(400).json({
            success: false,
            message: 'Title and description are required'
        });
    }

    const query = `
        INSERT INTO positions (title, description, is_executive, number_of_positions)
        VALUES (?, ?, ?, ?)
    `;

    const isExec = isExecutive ? 1 : 0;
    const numPos = numberOfPositions || 1;

    db.run(query, [title, description, isExec, numPos], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create position',
                error: err.message
            });
        }

        const positionId = this.lastID;

        // Insert responsibilities if provided
        if (responsibilities && responsibilities.length > 0) {
            const respQuery = `INSERT INTO position_responsibilities (position_id, responsibility) VALUES (?, ?)`;
            const stmt = db.prepare(respQuery);

            responsibilities.forEach(resp => {
                if (resp.trim()) {
                    stmt.run([positionId, resp.trim()]);
                }
            });

            stmt.finalize();
        }

        res.status(201).json({
            success: true,
            message: 'Position created successfully',
            position: {
                id: positionId,
                title,
                description,
                isExecutive: isExec === 1,
                numberOfPositions: numPos,
                responsibilities: responsibilities || []
            }
        });
    });
};

// Update position (admin only)
exports.updatePosition = (req, res) => {
    const { id } = req.params;
    const { title, description, isExecutive, numberOfPositions, responsibilities } = req.body;

    if (!title || !description) {
        return res.status(400).json({
            success: false,
            message: 'Title and description are required'
        });
    }

    const isExec = isExecutive ? 1 : 0;
    const numPos = numberOfPositions || 1;

    const query = `
        UPDATE positions 
        SET title = ?, description = ?, is_executive = ?, number_of_positions = ?
        WHERE id = ?
    `;

    db.run(query, [title, description, isExec, numPos, id], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update position',
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        // Delete old responsibilities
        db.run('DELETE FROM position_responsibilities WHERE position_id = ?', [id], (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update responsibilities',
                    error: err.message
                });
            }

            // Insert new responsibilities
            if (responsibilities && responsibilities.length > 0) {
                const respQuery = `INSERT INTO position_responsibilities (position_id, responsibility) VALUES (?, ?)`;
                const stmt = db.prepare(respQuery);

                responsibilities.forEach(resp => {
                    if (resp.trim()) {
                        stmt.run([id, resp.trim()]);
                    }
                });

                stmt.finalize();
            }

            res.json({
                success: true,
                message: 'Position updated successfully',
                position: {
                    id: parseInt(id),
                    title,
                    description,
                    isExecutive: isExec === 1,
                    numberOfPositions: numPos,
                    responsibilities: responsibilities || []
                }
            });
        });
    });
};

// Delete position (admin only)
exports.deletePosition = (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM positions WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to delete position',
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        res.json({
            success: true,
            message: 'Position deleted successfully'
        });
    });
};