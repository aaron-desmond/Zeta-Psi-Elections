import React from 'react';

function PositionCard({ position, isExpanded, onViewDetails, onApply }) {
    return (
        <div className={`position-card ${isExpanded ? 'expanded' : ''} ${position.isExecutive ? 'executive' : ''}`}>
            <div className="position-card-header">
                <div>
                    <div className="position-title-row">
                        <h2>{position.title}</h2>
                        {position.isExecutive && (
                            <span className="executive-badge">⭐ Executive</span>
                        )}
                    </div>
                    <p className="position-description">{position.description}</p>
                </div>
            </div>

            {/* Apply button - always visible */}
            <button 
                className="apply-btn-top"
                onClick={onApply}
            >
                Apply for {position.title}
            </button>

            <button 
                className="view-details-btn"
                onClick={onViewDetails}
            >
                {isExpanded ? 'Hide Details' : 'View Details'}
                <span className={`arrow ${isExpanded ? 'up' : 'down'}`}>▼</span>
            </button>

            {isExpanded && (
                <div className="position-details">
                    <div className="details-section">
                        <h3>📋 Responsibilities</h3>
                        <ul>
                            {position.responsibilities.map((resp, index) => (
                                <li key={index}>{resp}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PositionCard;