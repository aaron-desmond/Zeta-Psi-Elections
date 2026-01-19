const db = require('../config/database');

// Get all elections
exports.getAllElections = (req, res) => {
    const query = `
        SELECT e.*, p.title as position_title, p.number_of_positions,
               p.is_executive, p.description
        FROM elections e
        JOIN positions p ON e.position_id = p.id
        ORDER BY e.is_active DESC, e.started_at DESC
    `;

    db.all(query, [], (err, elections) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch elections',
                error: err.message
            });
        }

        const formatted = elections.map(elec => ({
            id: elec.id,
            positionId: elec.position_id,
            positionTitle: elec.position_title,
            numberOfPositions: elec.number_of_positions,
            isExecutive: elec.is_executive === 1,
            description: elec.description,
            isActive: elec.is_active === 1,
            currentRound: elec.current_round,
            startedAt: elec.started_at,
            endedAt: elec.ended_at
        }));

        res.json({
            success: true,
            elections: formatted
        });
    });
};

// Get active elections
exports.getActiveElections = (req, res) => {
    const query = `
        SELECT e.*, p.title as position_title, p.number_of_positions,
               p.is_executive, p.description
        FROM elections e
        JOIN positions p ON e.position_id = p.id
        WHERE e.is_active = 1
        ORDER BY p.is_executive DESC, p.title ASC
    `;

    db.all(query, [], (err, elections) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch active elections',
                error: err.message
            });
        }

        const formatted = elections.map(elec => ({
            id: elec.id,
            positionId: elec.position_id,
            positionTitle: elec.position_title,
            numberOfPositions: elec.number_of_positions,
            isExecutive: elec.is_executive === 1,
            description: elec.description,
            isActive: true,
            currentRound: elec.current_round,
            startedAt: elec.started_at
        }));

        res.json({
            success: true,
            elections: formatted
        });
    });
};

// Start election (admin only)
exports.startElection = (req, res) => {
    const { positionId } = req.body;

    if (!positionId) {
        return res.status(400).json({
            success: false,
            message: 'Position ID is required'
        });
    }

    // Check if there are any applications for this position
    db.get('SELECT COUNT(*) as count FROM applications WHERE position_id = ?', [positionId], (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (result.count === 0) {
            return res.status(400).json({
                success: false,
                message: 'No applications found for this position'
            });
        }

        // Check if election already exists for this position
        db.get('SELECT id, is_active FROM elections WHERE position_id = ?', [positionId], (err, existing) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (existing && existing.is_active === 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Election is already active for this position'
                });
            }

            // Create or reactivate election
            let query, params;
            
            if (existing) {
                // Reactivate existing election
                query = `
                    UPDATE elections 
                    SET is_active = 1, current_round = 1, started_at = CURRENT_TIMESTAMP, ended_at = NULL
                    WHERE id = ?
                `;
                params = [existing.id];
            } else {
                // Create new election
                query = `
                    INSERT INTO elections (position_id, is_active, current_round, started_at)
                    VALUES (?, 1, 1, CURRENT_TIMESTAMP)
                `;
                params = [positionId];
            }

            db.run(query, params, function(err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to start election',
                        error: err.message
                    });
                }

                const electionId = existing ? existing.id : this.lastID;

                // Create round record
                db.run(
                    'INSERT INTO election_rounds (election_id, round_number) VALUES (?, 1)',
                    [electionId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to create round',
                                error: err.message
                            });
                        }

                        res.json({
                            success: true,
                            message: 'Election started successfully',
                            election: {
                                id: electionId,
                                positionId,
                                isActive: true,
                                currentRound: 1
                            }
                        });
                    }
                );
            });
        });
    });
};

// End election round (admin only)
exports.endElection = (req, res) => {
    const { id } = req.params;

    // Get election info first
    db.get(
        `SELECT e.*, p.number_of_positions, p.title as position_title
         FROM elections e
         JOIN positions p ON e.position_id = p.id
         WHERE e.id = ?`,
        [id],
        (err, election) => {
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

            // Get vote counts for current round to determine winner
            const voteQuery = `
                SELECT v.application_id, COUNT(*) as vote_count,
                       u.first_name, u.last_name
                FROM votes v
                JOIN applications a ON v.application_id = a.id
                JOIN users u ON a.user_id = u.id
                WHERE v.election_id = ? AND v.round_number = ?
                GROUP BY v.application_id
                ORDER BY vote_count DESC
            `;

            db.all(voteQuery, [id, election.current_round], (err, candidates) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch votes',
                        error: err.message
                    });
                }

                // Calculate total votes
                const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);
                const requiredVotes = Math.ceil(totalVotes * 2 / 3);
                
                // Get top candidate
                const topCandidate = candidates[0];
                
                // Check if top candidate meets 2/3 threshold
                const hasWinner = topCandidate && topCandidate.vote_count >= requiredVotes;

                // Check how many winners have been declared so far
                db.get(
                    'SELECT COUNT(*) as winner_count FROM winners WHERE election_id = ?',
                    [id],
                    (err, winnerCount) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Database error',
                                error: err.message
                            });
                        }

                        const totalWinners = winnerCount.winner_count;
                        const moreRoundsNeeded = totalWinners < election.number_of_positions;

                        // Only declare winner if they meet 2/3 threshold
                        if (hasWinner) {
                            db.run(
                                `INSERT INTO winners (election_id, application_id, round_number, vote_count)
                                 VALUES (?, ?, ?, ?)`,
                                [id, topCandidate.application_id, election.current_round, topCandidate.vote_count],
                                (err) => {
                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Failed to declare winner',
                                            error: err.message
                                        });
                                    }

                                    // End current round
                                    db.run(
                                        `UPDATE election_rounds 
                                         SET ended_at = CURRENT_TIMESTAMP 
                                         WHERE election_id = ? AND ended_at IS NULL`,
                                        [id],
                                        (err) => {
                                            if (err) {
                                                return res.status(500).json({
                                                    success: false,
                                                    message: 'Failed to end round',
                                                    error: err.message
                                                });
                                            }

                                            // Check if more rounds are needed
                                            if (moreRoundsNeeded) {
                                                // Pause election (set inactive) but don't fully end it
                                                db.run(
                                                    'UPDATE elections SET is_active = 0 WHERE id = ?',
                                                    [id],
                                                    (err) => {
                                                        if (err) {
                                                            return res.status(500).json({
                                                                success: false,
                                                                message: 'Failed to update election status',
                                                                error: err.message
                                                            });
                                                        }

                                                        res.json({
                                                            success: true,
                                                            message: `Round ${election.current_round} ended. ${topCandidate.first_name} ${topCandidate.last_name} wins!`,
                                                            needsNextRound: true,
                                                            winnersCount: totalWinners + 1,
                                                            totalSeats: election.number_of_positions,
                                                            winner: {
                                                                firstName: topCandidate.first_name,
                                                                lastName: topCandidate.last_name,
                                                                voteCount: topCandidate.vote_count,
                                                                roundNumber: election.current_round
                                                            }
                                                        });
                                                    }
                                                );
                                            } else {
                                                // All seats filled, end election completely
                                                db.run(
                                                    'UPDATE elections SET is_active = 0, ended_at = CURRENT_TIMESTAMP WHERE id = ?',
                                                    [id],
                                                    (err) => {
                                                        if (err) {
                                                            return res.status(500).json({
                                                                success: false,
                                                                message: 'Failed to end election',
                                                                error: err.message
                                                            });
                                                        }

                                                        res.json({
                                                            success: true,
                                                            message: `Election complete! All ${election.number_of_positions} seats filled.`,
                                                            needsNextRound: false,
                                                            winnersCount: totalWinners + 1,
                                                            totalSeats: election.number_of_positions,
                                                            winner: {
                                                                firstName: topCandidate.first_name,
                                                                lastName: topCandidate.last_name,
                                                                voteCount: topCandidate.vote_count,
                                                                roundNumber: election.current_round
                                                            }
                                                        });
                                                    }
                                                );
                                            }
                                        }
                                    );
                                }
                            );
                        } else {
                            // No winner meets 2/3 threshold - end round but don't declare winner
                            db.run(
                                `UPDATE election_rounds 
                                 SET ended_at = CURRENT_TIMESTAMP 
                                 WHERE election_id = ? AND ended_at IS NULL`,
                                [id],
                                (err) => {
                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Failed to end round',
                                            error: err.message
                                        });
                                    }

                                    // End election (set inactive) since no winner
                                    db.run(
                                        'UPDATE elections SET is_active = 0 WHERE id = ?',
                                        [id],
                                        (err) => {
                                            if (err) {
                                                return res.status(500).json({
                                                    success: false,
                                                    message: 'Failed to end election',
                                                    error: err.message
                                                });
                                            }

                                            res.json({
                                                success: true,
                                                message: totalVotes === 0 
                                                    ? 'Round ended with no votes cast'
                                                    : `Round ${election.current_round} ended. No candidate achieved 2/3 majority (${requiredVotes} votes required).`,
                                                needsNextRound: false,
                                                noMajority: true,
                                                totalVotes,
                                                requiredVotes,
                                                topCandidate: topCandidate ? {
                                                    firstName: topCandidate.first_name,
                                                    lastName: topCandidate.last_name,
                                                    voteCount: topCandidate.vote_count,
                                                    percentage: Math.round((topCandidate.vote_count / totalVotes) * 100)
                                                } : null
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            });
        }
    );
};

// Start next round for multi-seat election (admin only)
exports.startNextRound = (req, res) => {
    const { id } = req.params;

    // Get election info
    db.get(
        `SELECT e.*, p.number_of_positions, p.title as position_title
         FROM elections e
         JOIN positions p ON e.position_id = p.id
         WHERE e.id = ?`,
        [id],
        (err, election) => {
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

            // Check how many winners so far
            db.get(
                'SELECT COUNT(*) as winner_count FROM winners WHERE election_id = ?',
                [id],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Database error',
                            error: err.message
                        });
                    }

                    if (result.winner_count >= election.number_of_positions) {
                        return res.status(400).json({
                            success: false,
                            message: 'All seats already filled'
                        });
                    }

                    const nextRound = election.current_round + 1;

                    // Increment round and reactivate election
                    db.run(
                        'UPDATE elections SET current_round = ?, is_active = 1 WHERE id = ?',
                        [nextRound, id],
                        (err) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: 'Failed to start next round',
                                    error: err.message
                                });
                            }

                            // Create new round entry
                            db.run(
                                'INSERT INTO election_rounds (election_id, round_number) VALUES (?, ?)',
                                [id, nextRound],
                                (err) => {
                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Failed to create round',
                                            error: err.message
                                        });
                                    }

                                    res.json({
                                        success: true,
                                        message: `Round ${nextRound} started`,
                                        election: {
                                            id: election.id,
                                            positionId: election.position_id,
                                            positionTitle: election.position_title,
                                            currentRound: nextRound,
                                            isActive: true
                                        }
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

// Get election results
exports.getElectionResults = (req, res) => {
    const { id } = req.params;

    // Get election info
    db.get(
        `SELECT e.*, p.title as position_title, p.number_of_positions
         FROM elections e
         JOIN positions p ON e.position_id = p.id
         WHERE e.id = ?`,
        [id],
        (err, election) => {
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

            // Get vote counts for current round
            const voteQuery = `
                SELECT v.application_id, 
                       COUNT(*) as vote_count,
                       a.user_id,
                       u.first_name, u.last_name,
                       a.photo_path, a.statement
                FROM votes v
                JOIN applications a ON v.application_id = a.id
                JOIN users u ON a.user_id = u.id
                WHERE v.election_id = ? AND v.round_number = ?
                GROUP BY v.application_id
                ORDER BY vote_count DESC
            `;

            db.all(voteQuery, [id, election.current_round], (err, votes) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to fetch votes',
                        error: err.message
                    });
                }

                // Get total votes for percentage calculation
                const totalVotes = votes.reduce((sum, v) => sum + v.vote_count, 0);

                // Get previous winners if multi-round
                db.all(
                    `SELECT w.*, u.first_name, u.last_name, w.round_number, w.application_id
                     FROM winners w
                     JOIN applications a ON w.application_id = a.id
                     JOIN users u ON a.user_id = u.id
                     WHERE w.election_id = ?
                     ORDER BY w.round_number DESC, w.vote_count DESC`,
                    [id],
                    (err, winners) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to fetch winners',
                                error: err.message
                            });
                        }

                        // Calculate required votes for 2/3 majority
                        const requiredVotes = Math.ceil(totalVotes * 2 / 3);

                        const candidates = votes.map(v => ({
                            applicationId: v.application_id,
                            firstName: v.first_name,
                            lastName: v.last_name,
                            photoPath: v.photo_path,
                            voteCount: v.vote_count,
                            percentage: totalVotes > 0 ? Math.round((v.vote_count / totalVotes) * 100) : 0,
                            meetsThreshold: v.vote_count >= requiredVotes
                        }));

                        res.json({
                            success: true,
                            election: {
                                id: election.id,
                                positionId: election.position_id,
                                positionTitle: election.position_title,
                                numberOfPositions: election.number_of_positions,
                                isActive: election.is_active === 1,
                                currentRound: election.current_round
                            },
                            results: {
                                totalVotes,
                                requiredVotes,
                                candidates
                            },
                            previousWinners: winners.map(w => ({
                                applicationId: w.application_id,
                                firstName: w.first_name,
                                lastName: w.last_name,
                                voteCount: w.vote_count,
                                roundNumber: w.round_number
                            }))
                        });
                    }
                );
            });
        }
    );
};

// Reset all elections (admin only)
exports.resetAllElections = (req, res) => {
    db.serialize(() => {
        db.run('DELETE FROM votes', (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to reset elections',
                    error: err.message
                });
            }

            db.run('DELETE FROM winners', (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to reset elections',
                        error: err.message
                    });
                }

                db.run('DELETE FROM election_rounds', (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to reset elections',
                            error: err.message
                        });
                    }

                    db.run('DELETE FROM elections', (err) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to reset elections',
                                error: err.message
                            });
                        }

                        db.run('DELETE FROM applications', (err) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: 'Failed to reset elections',
                                    error: err.message
                                });
                            }

                            res.json({
                                success: true,
                                message: 'All elections reset successfully'
                            });
                        });
                    });
                });
            });
        });
    });
};