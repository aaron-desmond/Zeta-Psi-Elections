import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { electionsAPI, positionsAPI, applicationsAPI, votingAPI } from '../../utils/api';
import './AdminDashboard.css';

function AdminDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        applications: 0,
        positions: 0,
        votes: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    // Redirect if not admin
    if (!currentUser?.isAdmin) {
        navigate('/dashboard');
        return null;
    }

    const loadStats = async () => {
        try {
            setLoading(true);
            
            // Load all stats from backend
            const [applicationsRes, positionsRes, votingHistoryRes] = await Promise.all([
                applicationsAPI.getAll(),
                positionsAPI.getAll(),
                votingAPI.getHistory().catch(() => ({ votes: [] })) // May fail if no votes
            ]);
            
            setStats({
                applications: applicationsRes.applications?.length || 0,
                positions: positionsRes.positions?.length || 0,
                votes: votingHistoryRes.votes?.length || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetAllElections = async () => {
        const confirmMessage = `⚠️ RESET ALL ELECTIONS?\n\n` +
            `This will permanently delete:\n` +
            `• ${stats.applications} total application${stats.applications !== 1 ? 's' : ''}\n` +
            `• ${stats.votes} total vote${stats.votes !== 1 ? 's' : ''}\n` +
            `• All election history for ALL positions\n\n` +
            `This action CANNOT be undone!\n\n` +
            `Type "RESET ALL" below to confirm:`;
        
        const userInput = prompt(confirmMessage);
        
        if (userInput === 'RESET ALL') {
            try {
                setLoading(true);
                
                // Call backend API to reset all elections
                const response = await electionsAPI.resetAll();
                
                if (response.success) {
                    alert('✅ All elections have been reset!\n\nAll applications, votes, and election data have been cleared.');
                    // Reload stats
                    await loadStats();
                } else {
                    alert('Failed to reset elections: ' + (response.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error resetting elections:', error);
                alert('Failed to reset elections: ' + (error.message || 'Network error'));
            } finally {
                setLoading(false);
            }
        } else if (userInput !== null) {
            alert('Reset cancelled. You must type "RESET ALL" exactly to confirm.');
        }
    };

    const adminActions = [
        {
            id: 'manage-positions',
            title: 'Manage Positions',
            icon: '🛠️',
            description: 'Create, edit, and delete executive positions',
            color: '#667eea',
            onClick: () => navigate('/admin/positions')
        },
        {
            id: 'start-elections',
            title: 'Start Elections',
            icon: '🗳️',
            description: 'Begin live voting for each position (in-person elections)',
            color: '#4CAF50',
            onClick: () => navigate('/admin/elections')
        },
        {
            id: 'reset-all',
            title: 'Reset All Elections',
            icon: '🔄',
            description: 'Clear all applications, votes, and election data (use after election season)',
            color: '#ff9800',
            onClick: resetAllElections
        }
    ];

    return (
        <div className="admin-dashboard-container">
            <div className="admin-dashboard-header">
                <h1>Admin Dashboard</h1>
                <p className="admin-subtitle">
                    Manage positions and control live elections
                </p>
            </div>

            <div className="admin-actions-grid">
                {adminActions.map(action => (
                    <div 
                        key={action.id}
                        className="admin-action-card"
                        onClick={action.onClick}
                        style={{ borderColor: action.color }}
                    >
                        <div className="action-icon" style={{ background: action.color }}>
                            <span>{action.icon}</span>
                        </div>
                        <div className="action-content">
                            <h3>{action.title}</h3>
                            <p>{action.description}</p>
                        </div>
                        <div className="action-arrow" style={{ color: action.color }}>
                            →
                        </div>
                    </div>
                ))}
            </div>

            <div className="admin-info">
                <div className="info-section">
                    <h3>📋 Quick Stats</h3>
                    {loading ? (
                        <div className="loading">Loading stats...</div>
                    ) : (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-number">{stats.applications}</span>
                                <span className="stat-label">Total Applications</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-number">{stats.positions}</span>
                                <span className="stat-label">Active Positions</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-number">{stats.votes}</span>
                                <span className="stat-label">Total Votes Cast</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;