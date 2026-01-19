const pool = require('../config/database');

// Get all positions
exports.getAllPositions = async (req, res) => {
    try {
        const query = `
            SELECT p.*, 
                   STRING_AGG(pr.responsibility, '|||') as responsibilities
            FROM positions p
            LEFT JOIN position_responsibilities pr ON p.id = pr.position_id
            GROUP BY p.id
            ORDER BY p.is_executive DESC, p.title ASC
        `;

        const result = await pool.query(query);
        const positions = result.rows;

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
    } catch (error) {
        console.error('Get all positions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch positions',
            error: error.message
        });
    }
};

// Get single position
exports.getPosition = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT p.*, 
                   STRING_AGG(pr.responsibility, '|||') as responsibilities
            FROM positions p
            LEFT JOIN position_responsibilities pr ON p.id = pr.position_id
            WHERE p.id = $1
            GROUP BY p.id
        `;

        const result = await pool.query(query, [id]);
        const position = result.rows[0];

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
    } catch (error) {
        console.error('Get position error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch position',
            error: error.message
        });
    }
};

// Create position (admin only)
exports.createPosition = async (req, res) => {
    try {
        const { title, description, isExecutive, numberOfPositions, responsibilities } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const insertQuery = `
                INSERT INTO positions (title, description, is_executive, number_of_positions)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

            const result = await client.query(insertQuery, [
                title,
                description,
                isExecutive ? 1 : 0,
                numberOfPositions || 1
            ]);

            const position = result.rows[0];

            // Insert responsibilities if provided
            if (responsibilities && Array.isArray(responsibilities) && responsibilities.length > 0) {
                const respQuery = 'INSERT INTO position_responsibilities (position_id, responsibility) VALUES ($1, $2)';
                
                for (const resp of responsibilities) {
                    if (resp && resp.trim()) {
                        await client.query(respQuery, [position.id, resp.trim()]);
                    }
                }
            }

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Position created successfully',
                position: {
                    id: position.id,
                    title: position.title,
                    description: position.description,
                    isExecutive: position.is_executive === 1,
                    numberOfPositions: position.number_of_positions,
                    responsibilities: responsibilities || []
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create position error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create position',
            error: error.message
        });
    }
};

// Update position (admin only)
exports.updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, isExecutive, numberOfPositions, responsibilities } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const updateQuery = `
                UPDATE positions
                SET title = $1, description = $2, is_executive = $3, number_of_positions = $4
                WHERE id = $5
                RETURNING *
            `;

            const result = await client.query(updateQuery, [
                title,
                description,
                isExecutive ? 1 : 0,
                numberOfPositions || 1,
                id
            ]);

            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Position not found'
                });
            }

            // Delete old responsibilities
            await client.query('DELETE FROM position_responsibilities WHERE position_id = $1', [id]);

            // Insert new responsibilities
            if (responsibilities && Array.isArray(responsibilities) && responsibilities.length > 0) {
                const respQuery = 'INSERT INTO position_responsibilities (position_id, responsibility) VALUES ($1, $2)';
                
                for (const resp of responsibilities) {
                    if (resp && resp.trim()) {
                        await client.query(respQuery, [id, resp.trim()]);
                    }
                }
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Position updated successfully',
                position: {
                    id: result.rows[0].id,
                    title: result.rows[0].title,
                    description: result.rows[0].description,
                    isExecutive: result.rows[0].is_executive === 1,
                    numberOfPositions: result.rows[0].number_of_positions,
                    responsibilities: responsibilities || []
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update position error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update position',
            error: error.message
        });
    }
};

// Delete position (admin only)
exports.deletePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM positions WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Position not found'
            });
        }

        res.json({
            success: true,
            message: 'Position deleted successfully'
        });
    } catch (error) {
        console.error('Delete position error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete position',
            error: error.message
        });
    }
};