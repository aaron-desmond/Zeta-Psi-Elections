const pool = require('../config/database');

// Cast vote
exports.castVote = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const voterId = req.user.id;
        const { electionId, applicationId } = req.body;

        if (!electionId || !applicationId) {
            return res.status(400).json({
                success: false,
                message: 'Election ID and Application ID are required'
            });
        }

        await client.query('BEGIN');

        // Get election details
        const electionQuery = 'SELECT * FROM elections WHERE id = $1 AND is_active = 1';
        const electionResult = await client.query(electionQuery, [electionId]);
        const election = electionResult.rows[0];

        if (!election) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Active election not found'
            });
        }

        const currentRound = election.current_round;

        // Check if user already voted in this round
        const checkQuery = 'SELECT id FROM votes WHERE election_id = $1 AND round_number = $2 AND voter_id = $3';
        const checkResult = await client.query(checkQuery, [electionId, currentRound, voterId]);

        if (checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'You have already voted in this round'
            });
        }

        // Verify application exists and is for the correct position
        const appQuery = 'SELECT * FROM applications WHERE id = $1 AND position_id = $2';
        const appResult = await client.query(appQuery, [applicationId, election.position_id]);

        if (appResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Invalid application for this election'
            });
        }

        // Check if candidate already won in a previous round
        const winnerQuery = 'SELECT id FROM winners WHERE election_id = $1 AND application_id = $2';
        const winnerResult = await client.query(winnerQuery, [electionId, applicationId]);

        if (winnerResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'This candidate has already won in a previous round'
            });
        }

        // Cast vote
        const voteQuery = `
            INSERT INTO votes (election_id, round_number, voter_id, application_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const voteResult = await client.query(voteQuery, [electionId, currentRound, voterId, applicationId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Vote cast successfully',
            vote: {
                id: voteResult.rows[0].id,
                electionId: voteResult.rows[0].election_id,
                roundNumber: voteResult.rows[0].round_number,
                applicationId: voteResult.rows[0].application_id,
                votedAt: voteResult.rows[0].voted_at
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Vote error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cast vote',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Check if user has voted
exports.hasVoted = async (req, res) => {
    try {
        const voterId = req.user.id;
        const { electionId } = req.params;

        // Get election current round
        const electionQuery = 'SELECT current_round FROM elections WHERE id = $1';
        const electionResult = await pool.query(electionQuery, [electionId]);

        if (electionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Election not found'
            });
        }

        const currentRound = electionResult.rows[0].current_round;

        // Check if voted in current round
        const voteQuery = 'SELECT id FROM votes WHERE election_id = $1 AND round_number = $2 AND voter_id = $3';
        const voteResult = await pool.query(voteQuery, [electionId, currentRound, voterId]);

        res.json({
            success: true,
            hasVoted: voteResult.rows.length > 0,
            roundNumber: currentRound
        });
    } catch (error) {
        console.error('Has voted check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check voting status',
            error: error.message
        });
    }
};

// Get user's voting history
exports.getMyVotes = async (req, res) => {
    try {
        const voterId = req.user.id;

        const query = `
            SELECT v.*, e.position_id, p.title as position_title,
                   u.first_name, u.last_name
            FROM votes v
            JOIN elections e ON v.election_id = e.id
            JOIN positions p ON e.position_id = p.id
            JOIN applications a ON v.application_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE v.voter_id = $1
            ORDER BY v.voted_at DESC
        `;

        const result = await pool.query(query, [voterId]);
        const votes = result.rows.map(v => ({
            id: v.id,
            electionId: v.election_id,
            positionId: v.position_id,
            positionTitle: v.position_title,
            roundNumber: v.round_number,
            candidateName: `${v.first_name} ${v.last_name}`,
            votedAt: v.voted_at
        }));

        res.json({
            success: true,
            votes
        });
    } catch (error) {
        console.error('Get voting history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch voting history',
            error: error.message
        });
    }
};