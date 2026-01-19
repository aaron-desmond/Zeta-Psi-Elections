import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { positionsAPI } from '../../utils/api';
import './ManagePositions.css';

function ManagePositions() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadPositions();
    }, []);

    const loadPositions = async () => {
        try {
            setLoading(true);
            const response = await positionsAPI.getAll();
            setPositions(response.positions || []);
        } catch (error) {
            console.error('Error loading positions:', error);
            alert('Failed to load positions: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (positionId) => {
        if (window.confirm('Are you sure you want to delete this position? This action cannot be undone.')) {
            try {
                const response = await positionsAPI.delete(positionId);
                if (response.success) {
                    alert('Position deleted successfully!');
                    loadPositions(); // Reload the list
                } else {
                    alert('Failed to delete position: ' + (response.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error deleting position:', error);
                alert('Failed to delete position: ' + (error.message || 'Network error'));
            }
        }
    };

    const handleEdit = (position) => {
        navigate('/admin/positions/edit', { state: { position } });
    };

    const handleCreate = () => {
        navigate('/admin/positions/create');
    };

    if (loading) {
        return (
            <div className="manage-positions-container">
                <div className="loading">Loading positions...</div>
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
        <div className="manage-positions-container">
            <div className="manage-header">
                <div>
                    <h1>Manage Positions</h1>
                    <p className="manage-subtitle">
                        Create, edit, and delete executive positions
                    </p>
                </div>
                <button className="create-position-btn" onClick={handleCreate}>
                    + Create New Position
                </button>
            </div>

            <div className="positions-stats">
                <div className="stat-box">
                    <span className="stat-number">{positions.length}</span>
                    <span className="stat-label">Total Positions</span>
                </div>
                <div className="stat-box executive">
                    <span className="stat-number">
                        {positions.filter(p => p.isExecutive).length}
                    </span>
                    <span className="stat-label">Executive Positions</span>
                </div>
            </div>

            <div className="positions-list">
                {sortedPositions.map(position => (
                    <div 
                        key={position.id} 
                        className={`position-item ${position.isExecutive ? 'executive' : ''}`}
                    >
                        <div className="position-item-header">
                            <div className="position-title-section">
                                <h3>{position.title}</h3>
                                {position.isExecutive && (
                                    <span className="executive-badge-small">⭐ Executive</span>
                                )}
                            </div>
                            <div className="position-actions">
                                <button 
                                    className="edit-btn-small"
                                    onClick={() => handleEdit(position)}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="delete-btn-small"
                                    onClick={() => handleDelete(position.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <p className="position-description-small">{position.description}</p>

                        <div className="position-meta">
                            <span className="meta-item">
                                📋 {position.responsibilities?.length || 0} responsibilities
                            </span>
                            {position.numberOfPositions > 1 && (
                                <span className="meta-item">
                                    👥 {position.numberOfPositions} seats available
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {positions.length === 0 && (
                <div className="no-positions">
                    <p>No positions created yet.</p>
                    <button className="create-first-btn" onClick={handleCreate}>
                        Create Your First Position
                    </button>
                </div>
            )}
        </div>
    );
}

export default ManagePositions;