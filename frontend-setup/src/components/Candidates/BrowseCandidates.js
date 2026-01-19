import React, { useState, useEffect } from 'react';
import { positionsAPI, applicationsAPI } from '../../utils/api';
import ApplicationModal from '../Application/ApplicationModal';
import './BrowseCandidates.css';

function BrowseCandidates() {
    const [positions, setPositions] = useState([]);
    const [applications, setApplications] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Load positions from backend
            const positionsResponse = await positionsAPI.getAll();
            setPositions(positionsResponse.positions || []);
            
            // Load all applications from backend
            const applicationsResponse = await applicationsAPI.getAll();
            setApplications(applicationsResponse.applications || []);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load candidates: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Group applications by position
    const applicationsByPosition = positions.map(position => ({
        ...position,
        applicants: applications.filter(app => app.positionId === position.id)
    }));

    const handleViewApplication = (app) => {
        setSelectedApp(app);
    };

    if (loading) {
        return (
            <div className="browse-candidates-container">
                <div className="loading">Loading candidates...</div>
            </div>
        );
    }

    return (
        <div className="browse-candidates-container">
            <div className="browse-header">
                <h1>Browse Candidates</h1>
                <p className="browse-subtitle">
                    View all submitted applications for each position
                </p>
            </div>

            <div className="positions-list">
                {applicationsByPosition.map(position => (
                    <div key={position.id} className="position-section">
                        <div 
                            className="position-header"
                            onClick={() => setSelectedPosition(
                                selectedPosition === position.id ? null : position.id
                            )}
                        >
                            <div>
                                <h2>{position.title}</h2>
                                <p className="position-desc">{position.description}</p>
                            </div>
                            <div className="position-stats">
                                <span className="applicant-count">
                                    {position.applicants.length} {position.applicants.length === 1 ? 'Applicant' : 'Applicants'}
                                </span>
                                <span className={`expand-arrow ${selectedPosition === position.id ? 'up' : 'down'}`}>
                                    ▼
                                </span>
                            </div>
                        </div>

                        {selectedPosition === position.id && (
                            <div className="candidates-grid">
                                {position.applicants.length === 0 ? (
                                    <div className="no-candidates">
                                        <p>No applications submitted yet for this position.</p>
                                    </div>
                                ) : (
                                    position.applicants.map((app) => (
                                        <div key={app.id} className="candidate-card">
                                            {app.photoPath && (
                                                <img 
                                                    src={`http://localhost:5001${app.photoPath}`}
                                                    alt={`${app.firstName} ${app.lastName}`}
                                                    className="candidate-photo"
                                                />
                                            )}
                                            <div className="candidate-info">
                                                <h3>{app.firstName} {app.lastName}</h3>
                                                <div className="candidate-terms">
                                                    {app.terms && app.terms.slice(0, 2).map((term, i) => (
                                                        <span key={i} className="term-badge-small">
                                                            {term}
                                                        </span>
                                                    ))}
                                                    {app.terms && app.terms.length > 2 && (
                                                        <span className="more-terms">
                                                            +{app.terms.length - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="candidate-statement-preview">
                                                    {app.statement.substring(0, 120)}...
                                                </p>
                                                <button 
                                                    className="view-candidate-btn"
                                                    onClick={() => handleViewApplication(app)}
                                                >
                                                    View Full Application
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {positions.length === 0 && (
                <div className="no-positions">
                    <p>No positions available at this time.</p>
                </div>
            )}

            {selectedApp && (
                <ApplicationModal 
                    application={selectedApp}
                    onClose={() => setSelectedApp(null)}
                />
            )}
        </div>
    );
}

export default BrowseCandidates;