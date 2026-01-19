import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { electionsAPI, positionsAPI, applicationsAPI } from '../../utils/api';
import FloorNominationModal from './FloorNominationModal';
import './StartElections.css';

function StartElections() {
    const [positions, setPositions] = useState([]);
    const [elections, setElections] = useState([]);
    const [applicationsCount, setApplicationsCount] = useState({});
    const [winnersCount, setWinnersCount] = useState({});
    const [loading, setLoading] = useState(true);
    const [showFloorModal, setShowFloorModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        try {
            setLoading(true);
            
            // Load positions from backend
            const positionsResponse = await positionsAPI.getAll();
            const positionsData = positionsResponse.positions || [];
            setPositions(positionsData);
            
            // Load all elections from backend
            const electionsResponse = await electionsAPI.getAll();
            const electionsData = electionsResponse.elections || [];
            setElections(electionsData);
            
            // Load applications count for each position
            const allApplications = await applicationsAPI.getAll();
            const applications = allApplications.applications || [];
            
            // Count applications per position
            const counts = {};
            applications.forEach(app => {
                counts[app.positionId] = (counts[app.positionId] || 0) + 1;
            });
            setApplicationsCount(counts);
            
            // Get winners count for each election to determine progress
            const winners = {};
            for (const election of electionsData) {
                try {
                    const results = await electionsAPI.getResults(election.id);
                    winners[election.id] = results.previousWinners?.length || 0;
                } catch (error) {
                    winners[election.id] = 0;
                }
            }
            setWinnersCount(winners);
            
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load elections data: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const getElectionForPosition = (positionId) => {
        return elections.find(e => e.positionId === positionId);
    };

    const getApplicantsCount = (positionId) => {
        return applicationsCount[positionId] || 0;
    };

    const startVoting = async (position) => {
        const applicantsCount = getApplicantsCount(position.id);
        
        if (applicantsCount === 0) {
            alert('No applicants for this position. Cannot start voting.');
            return;
        }

        const isSingleSeat = position.numberOfPositions === 1;
        const message = isSingleSeat
            ? `Start voting for ${position.title}?\n\n${applicantsCount} candidate${applicantsCount !== 1 ? 's' : ''} available`
            : `Start Round 1 for ${position.title}?\n\n${applicantsCount} candidate${applicantsCount !== 1 ? 's' : ''} available\n${position.numberOfPositions} seats to fill`;

        if (window.confirm(message)) {
            try {
                setLoading(true);
                
                // Call the backend API to start the election
                const response = await electionsAPI.start(position.id);
                
                if (response.success) {
                    alert('Voting started successfully!');
                    // Navigate to live results
                    navigate(`/admin/elections/live/${position.id}`);
                } else {
                    alert('Failed to start election: ' + (response.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error starting election:', error);
                alert('Failed to start election: ' + (error.message || 'Network error'));
            } finally {
                setLoading(false);
            }
        }
    };

    const continueElection = async (election) => {
        const position = positions.find(p => p.id === election.positionId);
        if (!position) return;

        const winnersForElection = winnersCount[election.id] || 0;
        const remainingSeats = position.numberOfPositions - winnersForElection;
        const nextRound = election.currentRound + 1;

        if (window.confirm(
            `Continue election for ${position.title}?\n\n` +
            `Start Round ${nextRound}\n` +
            `${remainingSeats} seat${remainingSeats !== 1 ? 's' : ''} remaining`
        )) {
            try {
                setLoading(true);
                
                const response = await electionsAPI.startNextRound(election.id);
                
                if (response.success) {
                    alert(`Round ${nextRound} started successfully!`);
                    navigate(`/admin/elections/live/${position.id}`);
                } else {
                    alert('Failed to start next round: ' + (response.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error starting next round:', error);
                alert('Failed to start next round: ' + (error.message || 'Network error'));
            } finally {
                setLoading(false);
            }
        }
    };

    const viewResults = (positionId) => {
        navigate(`/admin/elections/live/${positionId}`);
    };

    if (loading) {
        return (
            <div className="start-elections-container">
                <div className="loading">Loading elections...</div>
            </div>
        );
    }

    // Sort: Executive first
    const sortedPositions = [...positions].sort((a, b) => {
        if (a.isExecutive && !b.isExecutive) return -1;
        if (!a.isExecutive && b.isExecutive) return 1;
        return 0;
    });

    return (
        <div className="start-elections-container">
            <div className="elections-header">
                <div>
                    <h1>Start Elections</h1>
                    <p className="elections-subtitle">
                        Begin live voting for each position. Elections are held one at a time.
                    </p>
                </div>
                <button 
                    className="floor-nomination-btn"
                    onClick={() => setShowFloorModal(true)}
                >
                    ➕ Add Floor Nomination
                </button>
            </div>

            <div className="elections-info-banner">
                <div className="info-box">
                    <span className="info-icon">📊</span>
                    <div>
                        <strong>How it works</strong>
                        <p>Click "Start Voting" to open live voting for a position. For multi-seat positions, elections will proceed in rounds until all spots are filled.</p>
                    </div>
                </div>
            </div>

            <div className="positions-election-list">
                {sortedPositions.map(position => {
                    const applicantsCount = getApplicantsCount(position.id);
                    const election = getElectionForPosition(position.id);
                    const isActive = election?.isActive || false;
                    const currentRound = election?.currentRound || 1;
                    const numberOfPositions = position.numberOfPositions || 1;
                    const isSingleSeat = numberOfPositions === 1;
                    const winnersForElection = election ? (winnersCount[election.id] || 0) : 0;
                    const allSeatsFilled = winnersForElection >= numberOfPositions;
                    const needsNextRound = election && !isActive && !allSeatsFilled && winnersForElection > 0;

                    return (
                        <div 
                            key={position.id} 
                            className={`election-item ${position.isExecutive ? 'executive' : ''} ${isActive ? 'active' : ''}`}
                        >
                            <div className="election-item-header">
                                <div className="election-title-section">
                                    <h3>{position.title}</h3>
                                    {position.isExecutive && (
                                        <span className="executive-badge-mini">⭐ Executive</span>
                                    )}
                                    {!isSingleSeat && (
                                        <span className="multi-seat-badge">
                                            👥 {numberOfPositions} Seats
                                        </span>
                                    )}
                                    {isActive && (
                                        <span className="live-badge">
                                            🔴 {isSingleSeat ? 'LIVE' : `ROUND ${currentRound} LIVE`}
                                        </span>
                                    )}
                                    {needsNextRound && (
                                        <span className="paused-badge">⏸️ Paused</span>
                                    )}
                                    {allSeatsFilled && (
                                        <span className="ended-badge">✅ Complete</span>
                                    )}
                                </div>
                                
                                <div className="election-stats">
                                    <span className="stat-pill">
                                        👥 {applicantsCount} {applicantsCount === 1 ? 'Applicant' : 'Applicants'}
                                    </span>
                                    {!isSingleSeat && election && winnersForElection > 0 && (
                                        <span className="stat-pill progress">
                                            {winnersForElection} of {numberOfPositions} elected
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="election-actions">
                                {!election && (
                                    <button 
                                        className="start-voting-btn"
                                        onClick={() => startVoting(position)}
                                        disabled={applicantsCount === 0 || loading}
                                    >
                                        ▶️ {isSingleSeat ? 'Start Voting' : 'Start Round 1'}
                                    </button>
                                )}
                                
                                {isActive && (
                                    <button 
                                        className="view-results-btn"
                                        onClick={() => viewResults(position.id)}
                                    >
                                        📊 View Live Results
                                    </button>
                                )}
                                
                                {needsNextRound && (
                                    <button 
                                        className="continue-btn"
                                        onClick={() => continueElection(election)}
                                        disabled={loading}
                                    >
                                        ▶️ Start Round {currentRound + 1}
                                    </button>
                                )}
                                
                                {election && !isActive && allSeatsFilled && (
                                    <button 
                                        className="view-results-btn"
                                        onClick={() => viewResults(position.id)}
                                    >
                                        📊 View Final Results
                                    </button>
                                )}
                            </div>

                            {applicantsCount === 0 && (
                                <div className="no-applicants-warning">
                                    ⚠️ No applicants for this position
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {positions.length === 0 && (
                <div className="no-positions">
                    <p>No positions created yet. Create positions first before starting elections.</p>
                    <button 
                        className="create-positions-btn"
                        onClick={() => navigate('/admin/positions')}
                    >
                        Go to Manage Positions
                    </button>
                </div>
            )}

            {showFloorModal && (
                <FloorNominationModal
                    positions={positions}
                    onClose={() => setShowFloorModal(false)}
                    onSuccess={loadAllData}
                />
            )}
        </div>
    );
}

export default StartElections;