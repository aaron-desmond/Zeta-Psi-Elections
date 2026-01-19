import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { positionsAPI } from '../../utils/api';
import PositionCard from './PositionCard';
import './Positions.css';

function PositionsList() {
    const [positions, setPositions] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadPositions();
    }, []);

    const loadPositions = async () => {
        try {
            setLoading(true);
            
            // Load positions from backend
            const response = await positionsAPI.getAll();
            setPositions(response.positions || []);
        } catch (error) {
            console.error('Error loading positions:', error);
            alert('Failed to load positions: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // Sort positions: Executive positions first, then others
    const sortedPositions = [...positions].sort((a, b) => {
        if (a.isExecutive && !b.isExecutive) return -1;
        if (!a.isExecutive && b.isExecutive) return 1;
        return 0;
    });

    const handleApply = (position) => {
        navigate('/apply', { state: { position } });
    };

    const handleViewDetails = (position) => {
        setSelectedPosition(selectedPosition?.id === position.id ? null : position);
    };

    if (loading) {
        return (
            <div className="positions-container">
                <div className="loading">Loading positions...</div>
            </div>
        );
    }

    return (
        <div className="positions-container">
            <div className="positions-header">
                <h1>Available Positions</h1>
                <p className="positions-subtitle">
                    Review the positions below and submit your application for the role that best fits your skills and interests.
                </p>
            </div>

            <div className="positions-info-banner">
                <div className="info-item">
                    <span className="info-icon">📅</span>
                    <div>
                        <strong>Application Deadline</strong>
                        <p>January 22, 2026</p>
                    </div>
                </div>
                <div className="info-item">
                    <span className="info-icon">📋</span>
                    <div>
                        <strong>Positions Available</strong>
                        <p>{sortedPositions.length} positions</p>
                    </div>
                </div>
                <div className="info-item">
                    <span className="info-icon">⭐</span>
                    <div>
                        <strong>Executive Positions</strong>
                        <p>{sortedPositions.filter(p => p.isExecutive).length} positions</p>
                    </div>
                </div>
            </div>

            <div className="positions-grid">
                {sortedPositions.map(position => (
                    <PositionCard
                        key={position.id}
                        position={position}
                        isExpanded={selectedPosition?.id === position.id}
                        onViewDetails={() => handleViewDetails(position)}
                        onApply={() => handleApply(position)}
                    />
                ))}
            </div>

            {positions.length === 0 && (
                <div className="no-positions">
                    <p>No positions available at this time. Please check back later.</p>
                </div>
            )}
        </div>
    );
}

export default PositionsList;