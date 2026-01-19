import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { electionsAPI, applicationsAPI, votingAPI } from '../../utils/api';
import './VotingDashboard.css';

function VotingDashboard() {
    const [activeElections, setActiveElections] = useState([]);
    const [votingHistory, setVotingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Load active elections from backend
            const electionsResponse = await electionsAPI.getActive();
            const elections = electionsResponse.elections || [];
            
            // For each election, get the candidate count
            const electionsWithCandidates = await Promise.all(
                elections.map(async (election) => {
                    try {
                        const appsResponse = await applicationsAPI.getByPosition(election.positionId);
                        return {
                            ...election,
                            candidatesCount: appsResponse.applications?.length || 0
                        };
                    } catch (error) {
                        console.error('Error loading candidates for election:', error);
                        return {
                            ...election,
                            candidatesCount: 0
                        };
                    }
                })
            );
            
            setActiveElections(electionsWithCandidates);
            
            // Load user's voting history
            try {
                const historyResponse = await votingAPI.getHistory();
                setVotingHistory(historyResponse.votes || []);
            } catch (error) {
                console.error('Error loading voting history:', error);
                setVotingHistory([]);
            }
            
        } catch (error) {
            console.error('Error loading elections:', error);
            alert('Failed to load elections: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const hasVoted = (electionId, currentRound) => {
        // Check if user voted in THIS specific round, not just the election
        return votingHistory.some(vote => 
            vote.electionId === electionId && vote.roundNumber === currentRound
        );
    };

    const handleVote = async (election) => {
        // Check if user has voted using the backend
        try {
            const votedResponse = await votingAPI.hasVoted(election.id);
            if (votedResponse.hasVoted) {
                alert('You have already voted for this position!');
                return;
            }
            navigate(`/vote/${election.positionId}`);
        } catch (error) {
            console.error('Error checking vote status:', error);
            // If error checking, still allow navigation
            navigate(`/vote/${election.positionId}`);
        }
    };

    if (loading) {
        return (
            <div className="voting-dashboard-container">
                <div className="loading">Loading elections...</div>
            </div>
        );
    }

    return (
        <div className="voting-dashboard-container">
            <div className="voting-header">
                <h1>Live Elections</h1>
                <p className="voting-subtitle">
                    Cast your vote for the positions currently accepting votes
                </p>
            </div>

            {activeElections.length === 0 ? (
                <div className="no-active-elections">
                    <div className="empty-icon">🗳️</div>
                    <h2>No Active Elections</h2>
                    <p>There are currently no positions open for voting. Check back later!</p>
                </div>
            ) : (
                <div className="active-elections-grid">
                    {activeElections.map(election => {
                        const voted = hasVoted(election.id, election.currentRound);

                        return (
                            <div 
                                key={election.id} 
                                className={`election-card ${election.isExecutive ? 'executive' : ''} ${voted ? 'voted' : ''}`}
                            >
                                <div className="election-card-header">
                                    <div className="election-title-area">
                                        <h3>{election.positionTitle}</h3>
                                        {election.isExecutive && (
                                            <span className="executive-badge-tiny">⭐ Executive</span>
                                        )}
                                    </div>
                                    <span className="live-badge-small">🔴 LIVE</span>
                                </div>

                                <p className="election-description">
                                    {election.description}
                                </p>

                                <div className="election-meta">
                                    <span className="meta-badge">
                                        👥 {election.candidatesCount} {election.candidatesCount === 1 ? 'Candidate' : 'Candidates'}
                                    </span>
                                    {election.currentRound && election.currentRound > 1 && (
                                        <span className="meta-badge">
                                            Round {election.currentRound}
                                        </span>
                                    )}
                                </div>

                                {voted ? (
                                    <div className="voted-status">
                                        <span className="checkmark">✓</span>
                                        <span>You've voted for this position</span>
                                    </div>
                                ) : (
                                    <button 
                                        className="vote-now-btn"
                                        onClick={() => handleVote(election)}
                                    >
                                        Vote Now →
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {votingHistory.length > 0 && (
                <div className="my-votes-section">
                    <h2>Your Votes</h2>
                    <div className="votes-summary">
                        <p>You have voted in {votingHistory.length} {votingHistory.length === 1 ? 'election' : 'elections'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VotingDashboard;