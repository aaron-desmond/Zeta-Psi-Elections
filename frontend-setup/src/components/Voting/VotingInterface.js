import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsAPI, votingAPI, electionsAPI } from '../../utils/api';
import './VotingInterface.css';

function VotingInterface() {
    const { positionId } = useParams(); // Changed from electionId to positionId
    const navigate = useNavigate();
    const [election, setElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [previousWinners, setPreviousWinners] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [positionId]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Get active elections and find the one for this position
            const activeElections = await electionsAPI.getActive();
            const activeElection = activeElections.elections?.find(
                e => e.positionId === parseInt(positionId)
            );
            
            if (!activeElection) {
                alert('This election is not currently active.');
                navigate('/vote');
                return;
            }
            
            setElection(activeElection);
            
            // Get candidates for this position
            const candidatesResponse = await applicationsAPI.getByPosition(activeElection.positionId);
            const allCandidates = candidatesResponse.applications || [];
            
            // Get election results to find previous winners
            const resultsResponse = await electionsAPI.getResults(activeElection.id);
            const winners = resultsResponse.previousWinners || [];
            setPreviousWinners(winners);
            
            // Get winner application IDs to exclude them
            const winnerAppIds = winners.map(w => w.applicationId);
            
            // Filter out previous winners from candidate pool
            const availableCandidates = allCandidates.filter(
                candidate => !winnerAppIds.includes(candidate.id)
            );
            
            setCandidates(availableCandidates);
            
            // Check if user has already voted in this round
            const voteStatus = await votingAPI.hasVoted(activeElection.id);
            setHasVoted(voteStatus.hasVoted || false);
            
        } catch (error) {
            console.error('Error loading voting data:', error);
            alert('Failed to load voting data: ' + (error.message || 'Unknown error'));
            navigate('/vote');
        } finally {
            setLoading(false);
        }
    };

    const handleVoteSubmit = async () => {
        if (!selectedCandidate) {
            alert('Please select a candidate before submitting your vote.');
            return;
        }
        
        if (!window.confirm(
            `Cast your vote for ${selectedCandidate.firstName} ${selectedCandidate.lastName}?\n\n` +
            `This action cannot be undone.`
        )) {
            return;
        }
        
        try {
            setLoading(true);
            
            // Submit vote to backend
            const response = await votingAPI.vote(
                election.id,
                selectedCandidate.id
            );
            
            if (response.success) {
                alert(`✅ Vote submitted successfully!\n\nYou voted for ${selectedCandidate.firstName} ${selectedCandidate.lastName}.`);
                setHasVoted(true);
            } else {
                alert('Failed to submit vote: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('Failed to submit vote: ' + (error.message || 'Network error'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="voting-interface-container">
                <div className="loading">Loading candidates...</div>
            </div>
        );
    }

    if (!election) {
        return (
            <div className="voting-interface-container">
                <div className="error">Election not found</div>
            </div>
        );
    }

    const isSingleSeat = election.numberOfPositions === 1;
    const isMultiRound = election.currentRound > 1;

    if (hasVoted) {
        return (
            <div className="voting-interface-container">
                <div className="vote-confirmation">
                    <div className="confirmation-icon">✅</div>
                    <h2>Vote Recorded</h2>
                    <p>
                        You've already voted in {isSingleSeat ? 'this election' : `Round ${election.currentRound}`} for {election.positionTitle}.
                    </p>
                    <p className="vote-message">
                        Your vote has been securely recorded and cannot be changed.
                    </p>
                    {!isSingleSeat && previousWinners.length > 0 && (
                        <div className="previous-winners-info">
                            <h3>Previously Elected:</h3>
                            <ul>
                                {previousWinners.map((winner, index) => (
                                    <li key={index}>
                                        {winner.firstName} {winner.lastName} (Round {winner.roundNumber})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/vote')}
                    >
                        Back to Elections
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="voting-interface-container">
            <div className="voting-header">
                <h1>{election.positionTitle}</h1>
                <p className="election-info">
                    {isSingleSeat 
                        ? 'Select one candidate to vote for'
                        : `Round ${election.currentRound} of ${election.numberOfPositions} - Select one candidate`
                    }
                </p>
                {!isSingleSeat && (
                    <p className="seats-info">
                        {previousWinners.length} of {election.numberOfPositions} seats filled
                    </p>
                )}
            </div>

            {/* Show previous winners if multi-round */}
            {previousWinners.length > 0 && !isSingleSeat && (
                <div className="previous-winners-section">
                    <h3>🏆 Already Elected:</h3>
                    <div className="winners-chips">
                        {previousWinners.map((winner, index) => (
                            <span key={index} className="winner-chip">
                                {winner.firstName} {winner.lastName}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {candidates.length === 0 ? (
                <div className="no-candidates">
                    <p>No candidates available for this round.</p>
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/vote')}
                    >
                        Back to Elections
                    </button>
                </div>
            ) : (
                <>
                    <div className="candidates-list">
                        {candidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className={`candidate-card ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
                                onClick={() => setSelectedCandidate(candidate)}
                            >
                                {candidate.photoPath && (
                                    <img
                                        src={`http://localhost:5001${candidate.photoPath}`}
                                        alt={`${candidate.firstName} ${candidate.lastName}`}
                                        className="candidate-photo"
                                    />
                                )}
                                <div className="candidate-info">
                                    <h3>{candidate.firstName} {candidate.lastName}</h3>
                                    <div className="candidate-terms">
                                        {candidate.terms?.map((term, index) => (
                                            <span key={index} className="term-badge">
                                                {term}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="candidate-statement">
                                        {candidate.statement}
                                    </p>
                                </div>
                                {selectedCandidate?.id === candidate.id && (
                                    <div className="selected-indicator">✓ Selected</div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="voting-actions">
                        <button
                            className="back-btn"
                            onClick={() => navigate('/vote')}
                        >
                            ← Cancel
                        </button>
                        <button
                            className="submit-vote-btn"
                            onClick={handleVoteSubmit}
                            disabled={!selectedCandidate || loading}
                        >
                            {loading ? 'Submitting...' : '✓ Cast Vote'}
                        </button>
                    </div>

                    <div className="voting-info">
                        <p>⚠️ Your vote is final and cannot be changed once submitted.</p>
                        <p>✓ All votes are anonymous and secure.</p>
                    </div>
                </>
            )}
        </div>
    );
}

export default VotingInterface;