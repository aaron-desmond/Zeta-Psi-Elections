import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { electionsAPI } from '../../utils/api';
import runForPositionIcon from '../../Images/Run_For_Position-removebg-preview.png';
import voteInElectionsIcon from '../../Images/Vote_in_election-removebg-preview.png';
import viewCandidatesIcon from '../../Images/View_Candidates-removebg-preview.png';
import myApplicationsIcon from '../../Images/My_Applications_fixed.png';
import './Dashboard.css';

function Dashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeElectionsCount, setActiveElectionsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkActiveElections();
    }, []);

    const checkActiveElections = async () => {
        try {
            setLoading(true);
            
            // Load active elections from backend
            const response = await electionsAPI.getActive();
            const activeCount = response.elections?.length || 0;
            setActiveElectionsCount(activeCount);
        } catch (error) {
            console.error('Error loading active elections:', error);
            setActiveElectionsCount(0);
        } finally {
            setLoading(false);
        }
    };

    const dashboardItems = [
        {
            id: 'run-for-position',
            title: 'Run for Position',
            icon: runForPositionIcon,
            iconType: 'image',
            description: 'Submit your application for an executive position',
            color: '#667eea',
            available: true,
            onClick: () => navigate('/positions')
        },
        {
            id: 'vote',
            title: 'Vote in Election',
            icon: voteInElectionsIcon,
            iconType: 'image',
            description: activeElectionsCount > 0 
                ? `${activeElectionsCount} ${activeElectionsCount === 1 ? 'position is' : 'positions are'} open for voting!`
                : 'No active elections at this time',
            color: '#FF9800',
            available: activeElectionsCount > 0,
            onClick: () => navigate('/vote'),
            badge: activeElectionsCount > 0 ? '🔴 LIVE' : null
        },
        {
            id: 'view-candidates',
            title: 'View Candidates',
            icon: viewCandidatesIcon,
            iconType: 'image',
            description: 'Browse all candidates running for positions',
            color: '#4CAF50',
            available: true,
            onClick: () => navigate('/candidates')
        },
        {
            id: 'my-applications',
            title: 'My Applications',
            icon: myApplicationsIcon,
            iconType: 'image',
            description: 'View and manage your position applications',
            color: '#9C27B0',
            available: true,
            onClick: () => navigate('/my-applications')
        }
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Welcome back, {currentUser.firstName}! 👋</h1>
                <p className="dashboard-subtitle">
                    Manage your applications and participate in chapter elections
                </p>
            </div>

            <div className="dashboard-grid">
                {dashboardItems.map(item => (
                    <div 
                        key={item.id}
                        className={`dashboard-card ${!item.available ? 'coming-soon' : ''}`}
                        onClick={item.available ? item.onClick : undefined}
                        style={{ 
                            borderColor: item.color,
                            cursor: item.available ? 'pointer' : 'default'
                        }}
                    >
                        {item.badge && (
                            <span className="card-badge">{item.badge}</span>
                        )}
                        <div className="card-icon" style={{ background: item.color }}>
                            {item.iconType === 'image' ? (
                                <img 
                                    src={item.icon} 
                                    alt={item.title} 
                                    className={`icon-image icon-${item.id}`}  // Add unique class
                                />
                            ) : (
                                <span>{item.icon}</span>
                            )}
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        {!item.available && (
                            <div className="coming-soon-badge">Coming Soon</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="quick-info">
                <div className="info-card">
                    <h3>Important Dates</h3>
                    <ul>
                        <li>Application Deadline: January 22, 2026</li>
                        <li>Elections: January 29, 2026</li>
                        <li>Summer Elections: May, 2026</li>
                    </ul>
                </div>
                
                <div className="info-card">
                    <h3>How It Works</h3>
                    <ol>
                        <li>Browse available positions</li>
                        <li>Submit your application with statement and photo</li>
                        <li>Wait for election period to begin</li>
                        <li>Vote for your preferred candidates</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;