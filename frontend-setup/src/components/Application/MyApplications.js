import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { applicationsAPI } from '../../utils/api';
import ApplicationModal from './ApplicationModal';
import './MyApplications.css';

function MyApplications() {
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const response = await applicationsAPI.getMy();
            setApplications(response.applications || []);
        } catch (error) {
            console.error('Error loading applications:', error);
            alert('Failed to load applications: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleView = (app) => {
        setSelectedApp(app);
    };

    const handleEdit = (app) => {
        // Navigate to edit page with application data
        navigate('/apply/edit', { state: { application: app } });
    };

    const handleWithdraw = async (appId) => {
        if (window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
            try {
                const response = await applicationsAPI.delete(appId);
                if (response.success) {
                    alert('Application withdrawn successfully!');
                    loadApplications(); // Reload the list
                } else {
                    alert('Failed to withdraw application: ' + (response.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error withdrawing application:', error);
                alert('Failed to withdraw application: ' + (error.message || 'Network error'));
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="my-applications-container">
                <div className="loading">Loading applications...</div>
            </div>
        );
    }

    return (
        <div className="my-applications-container">
            <div className="my-applications-header">
                <h1>My Applications</h1>
                <button 
                    className="create-new-btn"
                    onClick={() => navigate('/positions')}
                >
                    + Create New Application
                </button>
            </div>

            {applications.length === 0 ? (
                <div className="no-applications">
                    <div className="empty-icon">📋</div>
                    <h2>No Applications Yet</h2>
                    <p>You haven't submitted any applications. Start by applying for a position!</p>
                    <button 
                        className="get-started-btn"
                        onClick={() => navigate('/positions')}
                    >
                        Browse Positions
                    </button>
                </div>
            ) : (
                <div className="applications-grid">
                    {applications.map((app) => (
                        <div key={app.id} className="application-card">
                            <div className="application-card-header">
                                <div className="app-position-info">
                                    <h3>{app.positionTitle}</h3>
                                    <span className="app-status pending">Pending Review</span>
                                </div>
                                {app.photoPath && (
                                    <img 
                                        src={`http://localhost:5001${app.photoPath}`}
                                        alt={`${app.firstName} ${app.lastName}`}
                                        className="app-photo"
                                    />
                                )}
                            </div>

                            <div className="application-details">
                                <div className="detail-row">
                                    <strong>Name:</strong>
                                    <span>{app.firstName} {app.lastName}</span>
                                </div>

                                <div className="detail-row">
                                    <strong>Terms:</strong>
                                    <div className="terms-list">
                                        {app.terms && app.terms.map((term, idx) => (
                                            <span key={idx} className="term-badge">{term}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="detail-row">
                                    <strong>Submitted:</strong>
                                    <span>{formatDate(app.submittedAt)}</span>
                                </div>
                            </div>

                            <div className="application-statement">
                                <strong>Statement:</strong>
                                <p>{app.statement.substring(0, 150)}...</p>
                            </div>

                            <div className="application-actions">
                                <button 
                                    className="view-full-btn"
                                    onClick={() => handleView(app)}
                                >
                                    View Full
                                </button>
                                <button 
                                    className="edit-btn"
                                    onClick={() => handleEdit(app)}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="withdraw-btn"
                                    onClick={() => handleWithdraw(app.id)}
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>
                    ))}
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

export default MyApplications;