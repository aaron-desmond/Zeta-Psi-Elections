const pool = require('../config/database');

// Get all elections
exports.getAllElections = async (req, res) => {
    try {
        const query = `
            SELECT e.*, p.title as position_title, p.number_of_positions
            FROM elections e
            JOIN positions p ON e.position_id = p.id
            ORDER BY e.started_at DESC
        `;

        const result = await pool.query(query);
        const elections = result.rows.map(e => ({
            id: e.id,
            positionId: e.position_id,
            positionTitle: e.position_title,
            numberOfPositions: e.number_of_positions,
            isActive: e.is_active === 1,
            currentRound: e.current_round,
            startedAt: e.started_at,
            endedAt: e.ended_at
        }));

        res.json({
            success: true,
            elections
        });
    } catch (error) {
        console.error('Get all elections error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch elections',
            error: error.message
        });
    }
};

// Get active elections
exports.getActiveElections = async (req, res) => {
    try {
        const query = `
            SELECT e.*, p.title as position_title, p.number_of_positions
            FROM elections e
            JOIN positions p ON e.position_id = p.id
            WHERE e.is_active = 1
            ORDER BY e.started_at DESC
        `;

        const result = await pool.query(query);
        const elections = result.rows.map(e => ({
            id: e.id,
            positionId: e.position_id,
            positionTitle: e.position_title,
            numberOfPositions: e.number_of_positions,
            currentRound: e.current_round,
            startedAt: e.started_at
        }));

        res.json({
            success: true,
            elections
        });
    } catch (error) {
        console.error('Get active elections error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active elections',
            error: error.message
        });
    }
};

// Start election
exports.startElection = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { positionId } = req.body;

        if (!positionId) {
            return res.status(400).json({
                success: false,
                message: 'Position ID is required'
            });
        }

        await client.query('BEGIN');

        // Check if election already exists for this position
        const checkQuery = 'SELECT id FROM elections WHERE position_id = $1 AND is_active = 1';
        const checkResult = await client.query(checkQuery, [positionId]);

        if (checkResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'An active election already exists for this position'
            });
        }

        // Create election
        const electionQuery = `
            INSERT INTO elections (position_id, is_active, current_round, started_at)
            VALUES ($1, 1, 1, NOW())
            RETURNING *
        `;
        const electionResult = await client.query(electionQuery, [positionId]);
        const election = electionResult.rows[0];

        // Create first round
        const roundQuery = `
            INSERT INTO election_rounds (election_id, round_number, started_at)
            VALUES ($1, 1, NOW())
        `;
        await client.query(roundQuery, [election.id]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Election started successfully',
            election: {
                id: election.id,
                positionId: election.position_id,
                isActive: true,
                currentRound: 1,
                startedAt: election.started_at
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Start election error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start election',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// End election/round
exports.endElection = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Get election details
        const electionQuery = `
            SELECT e.*, p.number_of_positions, p.title as position_title
            FROM elections e
            JOIN positions p ON e.position_id = p.id
            WHERE e.id = $1
        `;
        const electionResult = await client.query(electionQuery, [id]);
        const election = electionResult.rows[0];

        if (!election) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Election not found'
            });
        }

        if (election.is_active !== 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Election is not active'
            });
        }

        const currentRound = election.current_round;
        const totalSeats = election.number_of_positions;

        // Get previous winners count
        const winnersQuery = 'SELECT COUNT(*) as count FROM winners WHERE election_id = $1';
        const winnersResult = await client.query(winnersQuery, [id]);
        const winnersCount = parseInt(winnersResult.rows[0].count);

        // Get vote counts for current round, excluding previous winners
        const voteCountQuery = `
            SELECT a.id, a.user_id, u.first_name, u.last_name, 
                   COUNT(v.id) as vote_count
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN votes v ON a.id = v.application_id AND v.election_id = $1 AND v.round_number = $2
            WHERE a.position_id = $3
              AND a.id NOT IN (SELECT application_id FROM winners WHERE election_id = $1)
            GROUP BY a.id, a.user_id, u.first_name, u.last_name
            ORDER BY vote_count DESC
        `;
        const voteCountResult = await client.query(voteCountQuery, [id, currentRound, election.position_id]);
        const candidates = voteCountResult.rows;

        if (candidates.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'No candidates available for this election'
            });
        }

        // Calculate total votes and 2/3 majority threshold
        const totalVotes = candidates.reduce((sum, c) => sum + parseInt(c.vote_count), 0);
        const requiredVotes = Math.ceil(totalVotes * 2 / 3);

        const topCandidate = candidates[0];
        const topCandidateVotes = parseInt(topCandidate.vote_count);

        // Check if top candidate has 2/3 majority
        const hasWinner = topCandidateVotes >= requiredVotes;

        // End current round
        const endRoundQuery = 'UPDATE election_rounds SET ended_at = NOW() WHERE election_id = $1 AND round_number = $2';
        await client.query(endRoundQuery, [id, currentRound]);

        if (hasWinner) {
            // Declare winner
            const winnerQuery = `
                INSERT INTO winners (election_id, application_id, round_number, vote_count)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(winnerQuery, [id, topCandidate.id, currentRound, topCandidateVotes]);

            const newWinnersCount = winnersCount + 1;

            // Check if all seats are filled
            if (newWinnersCount >= totalSeats) {
                // Election complete
                const completeQuery = 'UPDATE elections SET is_active = 0, ended_at = NOW() WHERE id = $1';
                await client.query(completeQuery, [id]);

                await client.query('COMMIT');

                return res.json({
                    success: true,
                    message: `Round ${currentRound} ended. ${topCandidate.first_name} ${topCandidate.last_name} wins! All seats filled. Election complete.`,
                    winner: {
                        firstName: topCandidate.first_name,
                        lastName: topCandidate.last_name,
                        voteCount: topCandidateVotes,
                        roundNumber: currentRound
                    },
                    electionComplete: true,
                    winnersCount: newWinnersCount,
                    totalSeats
                });
            } else {
                // More rounds needed
                await client.query('COMMIT');

                return res.json({
                    success: true,
                    message: `Round ${currentRound} ended. ${topCandidate.first_name} ${topCandidate.last_name} wins! ${newWinnersCount} of ${totalSeats} seats filled.`,
                    winner: {
                        firstName: topCandidate.first_name,
                        lastName: topCandidate.last_name,
                        voteCount: topCandidateVotes,
                        roundNumber: currentRound
                    },
                    needsNextRound: true,
                    winnersCount: newWinnersCount,
                    totalSeats
                });
            }
        } else {
            // No 2/3 majority - end round without winner
            await client.query('COMMIT');

            return res.json({
                success: true,
                message: `Round ${currentRound} ended. No candidate achieved 2/3 majority.`,
                noMajority: true,
                totalVotes,
                requiredVotes,
                topCandidate: {
                    firstName: topCandidate.first_name,
                    lastName: topCandidate.last_name,
                    voteCount: topCandidateVotes,
                    percentage: totalVotes > 0 ? ((topCandidateVotes / totalVotes) * 100).toFixed(2) : 0
                }
            });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('End election error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end election',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Start next round
exports.startNextRound = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const query = 'SELECT * FROM elections WHERE id = $1';
        const result = await client.query(query, [id]);
        const election = result.rows[0];

        if (!election) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Election not found'
            });
        }

        if (election.is_active !== 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Election is not active'
            });
        }

        const nextRound = election.current_round + 1;

        // Update election round
        const updateQuery = 'UPDATE elections SET current_round = $1 WHERE id = $2';
        await client.query(updateQuery, [nextRound, id]);

        // Create new round entry
        const roundQuery = 'INSERT INTO election_rounds (election_id, round_number, started_at) VALUES ($1, $2, NOW())';
        await client.query(roundQuery, [id, nextRound]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `Round ${nextRound} started successfully`,
            currentRound: nextRound
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Start next round error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start next round',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get election results
exports.getElectionResults = async (req, res) => {
    try {
        const { id } = req.params;

        // Get election details
        const electionQuery = `
            SELECT e.*, p.title as position_title, p.number_of_positions
            FROM elections e
            JOIN positions p ON e.position_id = p.id
            WHERE e.id = $1
        `;
        const electionResult = await pool.query(electionQuery, [id]);
        const election = electionResult.rows[0];

        if (!election) {
            return res.status(404).json({
                success: false,
                message: 'Election not found'
            });
        }

        const currentRound = election.current_round;

        // Get previous winners
        const winnersQuery = `
            SELECT w.*, a.user_id, u.first_name, u.last_name
            FROM winners w
            JOIN applications a ON w.application_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE w.election_id = $1
            ORDER BY w.round_number
        `;
        const winnersResult = await pool.query(winnersQuery, [id]);
        const previousWinners = winnersResult.rows.map(w => ({
            firstName: w.first_name,
            lastName: w.last_name,
            voteCount: w.vote_count,
            roundNumber: w.round_number
        }));

        // Get current round vote counts (excluding winners)
        const voteCountQuery = `
            SELECT a.id, a.user_id, u.first_name, u.last_name, a.photo_path, a.statement,
                   COUNT(v.id) as vote_count
            FROM applications a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN votes v ON a.id = v.application_id AND v.election_id = $1 AND v.round_number = $2
            WHERE a.position_id = $3
              AND a.id NOT IN (SELECT application_id FROM winners WHERE election_id = $1)
            GROUP BY a.id, a.user_id, u.first_name, u.last_name, a.photo_path, a.statement
            ORDER BY vote_count DESC
        `;
        const voteCountResult = await pool.query(voteCountQuery, [id, currentRound, election.position_id]);
        const candidates = voteCountResult.rows;

        // Calculate totals
        const totalVotes = candidates.reduce((sum, c) => sum + parseInt(c.vote_count), 0);
        const requiredVotes = Math.ceil(totalVotes * 2 / 3);

        const formattedCandidates = candidates.map(c => ({
            applicationId: c.id,
            userId: c.user_id,
            firstName: c.first_name,
            lastName: c.last_name,
            photoPath: c.photo_path,
            statement: c.statement,
            voteCount: parseInt(c.vote_count),
            percentage: totalVotes > 0 ? ((parseInt(c.vote_count) / totalVotes) * 100).toFixed(2) : 0,
            meetsThreshold: parseInt(c.vote_count) >= requiredVotes
        }));

        res.json({
            success: true,
            election: {
                id: election.id,
                positionId: election.position_id,
                positionTitle: election.position_title,
                numberOfPositions: election.number_of_positions,
                isActive: election.is_active === 1,
                currentRound: election.current_round,
                startedAt: election.started_at,
                endedAt: election.ended_at
            },
            results: {
                totalVotes,
                requiredVotes,
                candidates: formattedCandidates
            },
            previousWinners
        });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch election results',
            error: error.message
        });
    }
};

// Reset all elections (admin only)
exports.resetAllElections = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Delete all data in order (respecting foreign keys)
        await client.query('DELETE FROM votes');
        await client.query('DELETE FROM winners');
        await client.query('DELETE FROM election_rounds');
        await client.query('DELETE FROM elections');

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'All elections have been reset'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Reset elections error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset elections',
            error: error.message
        });
    } finally {
        client.release();
    }
};