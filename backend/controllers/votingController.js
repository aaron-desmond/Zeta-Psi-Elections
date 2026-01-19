const db = require('../config/database');

// Cast vote
exports.castVote = (req, res) => {
    const userId = req.user.id;
    const { electionId, applicationId } = req.body;

    if (!electionId || !applicationId) {
        return res.status(400).json({
            success: false,
            message: 'Election ID and Application ID are required'
        });
    }

    // Get election info
    db.get('SELECT * FROM elections WHERE id = ? AND is_active = 1', [electionId], (err, election) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!election) {
            return res.status(404).json({
                success: false,
                message: 'Active election not found'
            });
        }

        // Check if user already voted in this round
        db.get(
            'SELECT id FROM votes WHERE election_id = ? AND round_number = ? AND voter_id = ?',
            [electionId, election.current_round, userId],
            (err, existingVote) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                if (existingVote) {
                    return res.status(400).json({
                        success: false,
                        message: 'You have already voted in this round'
                    });
                }

                // Verify application exists and is for this position
                db.get(
                    'SELECT id FROM applications WHERE id = ? AND position_id = ?',
                    [applicationId, election.position_id],
                    (err, application) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Database error',
                                error: err.message
                            });
                        }

                        if (!application) {
                            return res.status(400).json({
                                success: false,
                                message: 'Invalid application for this position'
                            });
                        }

                        // Cast vote
                        const query = `
                            INSERT INTO votes (election_id, round_number, voter_id, application_id)
                            VALUES (?, ?, ?, ?)
                        `;

                        db.run(query, [electionId, election.current_round, userId, applicationId], function(err) {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: 'Failed to cast vote',
                                    error: err.message
                                });
                            }

                            res.json({
                                success: true,
                                message: 'Vote cast successfully',
                                vote: {
                                    id: this.lastID,
                                    electionId,
                                    roundNumber: election.current_round,
                                    applicationId
                                }
                            });
                        });
                    }
                );
            }
        );
    });
};

// Check if user has voted
exports.hasVoted = (req, res) => {
    const userId = req.user.id;
    const { electionId } = req.params;

    db.get('SELECT current_round FROM elections WHERE id = ?', [electionId], (err, election) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!election) {
            return res.status(404).json({
                success: false,
                message: 'Election not found'
            });
        }

        db.get(
            'SELECT id FROM votes WHERE election_id = ? AND round_number = ? AND voter_id = ?',
            [electionId, election.current_round, userId],
            (err, vote) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    hasVoted: !!vote,
                    roundNumber: election.current_round
                });
            }
        );
    });
};

// Get user's voting history
exports.getMyVotes = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT v.*, 
               e.position_id,
               p.title as position_title,
               u.first_name as candidate_first_name,
               u.last_name as candidate_last_name
        FROM votes v
        JOIN elections e ON v.election_id = e.id
        JOIN positions p ON e.position_id = p.id
        JOIN applications a ON v.application_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE v.voter_id = ?
        ORDER BY v.voted_at DESC
    `;

    db.all(query, [userId], (err, votes) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch voting history',
                error: err.message
            });
        }

        const formatted = votes.map(v => ({
            id: v.id,
            electionId: v.election_id,
            positionId: v.position_id,
            positionTitle: v.position_title,
            roundNumber: v.round_number,
            candidateName: `${v.candidate_first_name} ${v.candidate_last_name}`,
            votedAt: v.voted_at
        }));

        res.json({
            success: true,
            votes: formatted
        });
    });
};