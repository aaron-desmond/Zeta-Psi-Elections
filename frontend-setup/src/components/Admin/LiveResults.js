import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionsAPI } from '../../utils/api';
import './LiveResults.css';

function LiveResults() {
    const { positionId } = useParams();
    const navigate = useNavigate();
    const [electionData, setElectionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadElectionResults();
        
        // Refresh every 3 seconds if voting is active
        const interval = setInterval(() => {
            if (electionData?.election?.isActive) {
                loadElectionResults(true); // true = silent refresh
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [positionId, electionData?.election?.isActive]);

    const loadElectionResults = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            
            // Get all elections to find the election for this position
            const electionsResponse = await electionsAPI.getAll();
            const election = electionsResponse.elections?.find(
                e => e.positionId === parseInt(positionId)
            );
            
            if (!election) {
                alert('Election not found for this position.');
                navigate('/admin/elections');
                return;
            }
            
            // Get detailed results for this election
            const resultsResponse = await electionsAPI.getResults(election.id);
            setElectionData(resultsResponse);
            
        } catch (error) {
            console.error('Error loading election results:', error);
            if (!silent) {
                alert('Failed to load results: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleEndRound = async () => {
        if (!electionData) return;
        
        const { results, election } = electionData;
        const topCandidate = results.candidates[0];
        const hasWinner = topCandidate && results.totalVotes > 0;
        
        const isSingleSeat = election.numberOfPositions === 1;
        const roundText = isSingleSeat ? 'voting' : `Round ${election.currentRound}`;
        
        if (!hasWinner) {
            if (!window.confirm(`No votes have been cast. End ${roundText} anyway?`)) {
                return;
            }
        } else {
            // Check if top candidate has 2/3 majority
            const has2_3Majority = topCandidate.meetsThreshold;
            
            let confirmMessage;
            if (has2_3Majority) {
                confirmMessage = isSingleSeat 
                    ? `Declare ${topCandidate.firstName} ${topCandidate.lastName} as the winner?\n\nThey have ${topCandidate.voteCount} votes (${topCandidate.percentage}%) - meets 2/3 threshold.`
                    : `End Round ${election.currentRound} and declare ${topCandidate.firstName} ${topCandidate.lastName} as the winner?\n\nThey have ${topCandidate.voteCount} votes (${topCandidate.percentage}%) - meets 2/3 threshold.`;
            } else {
                confirmMessage = isSingleSeat
                    ? `No candidate achieved 2/3 majority.\n\nTop candidate: ${topCandidate.firstName} ${topCandidate.lastName} with ${topCandidate.voteCount} votes (${topCandidate.percentage}%)\nRequired: ${results.requiredVotes} votes (67%)\n\nEnd voting anyway? No winner will be declared.`
                    : `No candidate achieved 2/3 majority in Round ${election.currentRound}.\n\nTop candidate: ${topCandidate.firstName} ${topCandidate.lastName} with ${topCandidate.voteCount} votes (${topCandidate.percentage}%)\nRequired: ${results.requiredVotes} votes (67%)\n\nEnd round anyway? No winner will be declared.`;
            }
                
            if (!window.confirm(confirmMessage)) {
                return;
            }
        }
        
        try {
            setLoading(true);
            
            // End the round via backend API
            const response = await electionsAPI.end(election.id);
            
            if (response.success) {
                if (response.noMajority) {
                    // No winner declared due to lack of 2/3 majority
                    alert(
                        `⚠️ ${isSingleSeat ? 'Voting' : `Round ${election.currentRound}`} Ended\n\n` +
                        `No candidate achieved the required 2/3 majority.\n\n` +
                        (response.topCandidate 
                            ? `Top candidate: ${response.topCandidate.firstName} ${response.topCandidate.lastName}\n` +
                              `Votes: ${response.topCandidate.voteCount} (${response.topCandidate.percentage}%)\n` +
                              `Required: ${response.requiredVotes} votes (67%)\n\n`
                            : '') +
                        `No winner has been declared for this ${isSingleSeat ? 'position' : 'round'}.`
                    );
                } else if (response.needsNextRound) {
                    // More rounds needed
                    const remainingSeats = response.totalSeats - response.winnersCount;
                    alert(
                        `✅ Round ${election.currentRound} Complete!\n\n` +
                        `${response.winner.firstName} ${response.winner.lastName} has been elected!\n\n` +
                        `${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining.\n\n` +
                        `Click "Start Round ${election.currentRound + 1}" when ready.`
                    );
                } else if (response.winner) {
                    // All seats filled or single-seat complete
                    if (election.numberOfPositions === 1) {
                        alert(
                            `✅ Election Complete!\n\n` +
                            `${response.winner.firstName} ${response.winner.lastName} has been elected!`
                        );
                    } else {
                        alert(
                            `🎉 Election Complete!\n\n` +
                            `All ${election.numberOfPositions} seats have been filled!`
                        );
                    }
                }
                
                // Reload results to show updated status
                await loadElectionResults();
            } else {
                alert('Failed to end round: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error ending round:', error);
            alert('Failed to end round: ' + (error.message || 'Network error'));
        } finally {
            setLoading(false);
        }
    };

    const handleStartNextRound = async () => {
        if (!electionData) return;
        
        const { election, previousWinners } = electionData;
        const nextRound = election.currentRound + 1;
        const remainingSeats = election.numberOfPositions - (previousWinners?.length || 0);
        
        if (!window.confirm(
            `Start Round ${nextRound}?\n\n` +
            `${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining to fill.\n\n` +
            `Previous winners will be excluded from this round.`
        )) {
            return;
        }
        
        try {
            setLoading(true);
            
            const response = await electionsAPI.startNextRound(election.id);
            
            if (response.success) {
                alert(`✅ Round ${nextRound} has begun! Voters can now cast their votes.`);
                await loadElectionResults();
            } else {
                alert('Failed to start next round: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error starting next round:', error);
            alert('Failed to start next round: ' + (error.message || 'Network error'));
        } finally {
            setLoading(false);
        }
    };

    if (loading && !electionData) {
        return (
            <div className="live-results-container">
                <div className="loading">Loading election results...</div>
            </div>
        );
    }

    if (!electionData) {
        return (
            <div className="live-results-container">
                <div className="error">No election data available</div>
            </div>
        );
    }

    const { election, results, previousWinners } = electionData;
    const { totalVotes, requiredVotes, candidates } = results;
    const hasVotes = totalVotes > 0;
    const isSingleSeat = election.numberOfPositions === 1;
    const isMultiSeat = election.numberOfPositions > 1;
    const electionEnded = !election.isActive && previousWinners && previousWinners.length === election.numberOfPositions;
    const needsNextRound = !election.isActive && previousWinners && previousWinners.length < election.numberOfPositions;
    const votingActive = election.isActive;
    const topCandidate = candidates[0];
    const requiredPercentage = 66.67;
    const remainingSpots = election.numberOfPositions - (previousWinners?.length || 0);

    return (
        <div className="live-results-container">
            {refreshing && (
                <div className="refreshing-indicator">
                    <span>↻ Refreshing...</span>
                </div>
            )}
            
            <div className="results-header">
                <div>
                    <h1>{election.positionTitle} - {votingActive ? 'Live Results' : 'Final Results'}</h1>
                    {isMultiSeat && (
                        <div className="round-info">
                            Round {election.currentRound} of {election.numberOfPositions} • {remainingSpots} spot{remainingSpots !== 1 ? 's' : ''} remaining
                        </div>
                    )}
                    {votingActive ? (
                        <div className="live-indicator">
                            <span className="live-dot"></span>
                            {isSingleSeat ? 'LIVE VOTING' : `ROUND ${election.currentRound} LIVE`}
                        </div>
                    ) : needsNextRound ? (
                        <div className="paused-indicator">
                            ⏸️ Round {election.currentRound} Complete - Ready for Next Round
                        </div>
                    ) : electionEnded ? (
                        <div className="ended-indicator">
                            ✅ ELECTION COMPLETE
                        </div>
                    ) : (
                        <div className="ended-indicator">
                            VOTING ENDED
                        </div>
                    )}
                </div>
                <div className="header-actions">
                    {votingActive && (
                        <button 
                            className="end-voting-btn-large" 
                            onClick={handleEndRound}
                            disabled={loading}
                        >
                            {isSingleSeat ? '⏹️ End Voting' : `⏹️ End Round ${election.currentRound}`}
                        </button>
                    )}
                    {needsNextRound && (
                        <button 
                            className="start-next-round-btn-large" 
                            onClick={handleStartNextRound}
                            disabled={loading}
                        >
                            ▶️ Start Round {election.currentRound + 1}
                        </button>
                    )}
                    <button className="back-btn" onClick={() => navigate('/admin/elections')}>
                        ← Back to Elections
                    </button>
                </div>
            </div>

            {/* Previous Winners Display */}
            {previousWinners && previousWinners.length > 0 && (
                <div className="previous-winners-section">
                    <h2>🏆 {isMultiSeat ? `Elected So Far (${previousWinners.length}/${election.numberOfPositions})` : 'Winner'}</h2>
                    <div className="previous-winners-grid">
                        {previousWinners.map((winner, idx) => (
                            <div key={idx} className="previous-winner-card">
                                {isMultiSeat && <div className="previous-winner-round">Round {winner.roundNumber}</div>}
                                <div className="previous-winner-name">{winner.firstName} {winner.lastName}</div>
                                <div className="previous-winner-votes">
                                    {winner.voteCount} votes
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="results-stats">
                <div className="stat-card-large">
                    <span className="stat-number-large">{totalVotes}</span>
                    <span className="stat-label-large">Total Votes {isMultiSeat ? '(This Round)' : ''}</span>
                </div>
                <div className="stat-card-large">
                    <span className="stat-number-large">{candidates.length}</span>
                    <span className="stat-label-large">{isMultiSeat ? 'Remaining Candidates' : 'Candidates'}</span>
                </div>
                <div className="stat-card-large">
                    <span className="stat-number-large">{requiredVotes}</span>
                    <span className="stat-label-large">Votes for 2/3 Majority</span>
                </div>
            </div>

            {/* Winner announcement - ONLY shows after voting ends */}
            {!votingActive && topCandidate && totalVotes > 0 && !needsNextRound && (
                <div className={`winner-announcement ${!topCandidate.meetsThreshold ? 'no-majority' : ''}`}>
                    <h2>
                        {topCandidate.meetsThreshold 
                            ? `👑 ${isSingleSeat ? 'Winner' : `Round ${election.currentRound} Winner`} with 2/3 Majority`
                            : '⚠️ No 2/3 Majority Achieved'
                        }
                    </h2>
                    <div className="winner-card">
                        {topCandidate.photoPath && (
                            <img 
                                src={`http://localhost:5001${topCandidate.photoPath}`}
                                alt={`${topCandidate.firstName} ${topCandidate.lastName}`}
                                className="winner-photo"
                            />
                        )}
                        <h3>{topCandidate.firstName} {topCandidate.lastName}</h3>
                        <p className="winner-votes">
                            {topCandidate.voteCount} {topCandidate.voteCount === 1 ? 'vote' : 'votes'} ({topCandidate.percentage}%)
                        </p>
                        {!topCandidate.meetsThreshold && (
                            <div className="majority-warning">
                                <p>⚠️ Does not meet 2/3 majority requirement ({requiredPercentage}%)</p>
                                <p>May require additional consideration</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="results-list">
                <h2>{isSingleSeat ? 'Results' : `Round ${election.currentRound} Results`}</h2>
                {candidates.length === 0 ? (
                    <p className="no-votes">No remaining candidates for this position</p>
                ) : totalVotes === 0 ? (
                    <div className="no-votes-message">
                        <p>⏳ Waiting for votes...</p>
                        <p className="hint">Results will appear in real-time as members vote</p>
                    </div>
                ) : (
                    candidates.map((candidate, index) => {
                        return (
                            <div 
                                key={candidate.applicationId} 
                                className={`result-item ${candidate.meetsThreshold ? 'meets-majority' : ''}`}
                            >
                                <div className="result-candidate-info">
                                    <div className="result-rank">#{index + 1}</div>
                                    {candidate.photoPath && (
                                        <img 
                                            src={`http://localhost:5001${candidate.photoPath}`}
                                            alt={`${candidate.firstName} ${candidate.lastName}`}
                                            className="result-photo"
                                        />
                                    )}
                                    <div>
                                        <h4>{candidate.firstName} {candidate.lastName}</h4>
                                        <p className="result-votes">
                                            {candidate.voteCount} {candidate.voteCount === 1 ? 'vote' : 'votes'}
                                            {candidate.meetsThreshold && ' ✓ 2/3 Majority'}
                                        </p>
                                    </div>
                                </div>
                                <div className="result-bar-container">
                                    <div 
                                        className="result-bar"
                                        style={{ width: `${candidate.percentage}%` }}
                                    >
                                        <span className="result-percentage">{candidate.percentage}%</span>
                                    </div>
                                    {/* Show 2/3 threshold line */}
                                    <div 
                                        className="threshold-line"
                                        style={{ left: `${requiredPercentage}%` }}
                                        title="2/3 Majority Threshold"
                                    ></div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Info Box */}
            <div className="results-info-box">
                <h3>ℹ️ How It Works</h3>
                <ul>
                    <li>Results update automatically every 3 seconds</li>
                    <li>A candidate needs 2/3 of votes to meet the threshold</li>
                    {isMultiSeat && (
                        <>
                            <li>After each round, the winner is declared and removed from the pool</li>
                            <li>Voting continues until all {election.numberOfPositions} seats are filled</li>
                        </>
                    )}
                    <li>All voting is anonymous and secure</li>
                </ul>
            </div>
        </div>
    );
}

export default LiveResults;