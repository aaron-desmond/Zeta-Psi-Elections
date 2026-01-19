import React from 'react';

function DashboardCard({ item }) {
    const handleClick = () => {
        if (item.available) {
            item.onClick();
        }
    };

    return (
        <div 
            className={`dashboard-card ${!item.available ? 'disabled' : ''}`}
            onClick={handleClick}
            style={{ borderColor: item.color }}
        >
            <div className="card-icon" style={{ background: item.color }}>
                <span>{item.icon}</span>
            </div>
            
            <div className="card-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                
                {!item.available && item.comingSoon && (
                    <div className="coming-soon-badge">
                        {item.comingSoon}
                    </div>
                )}
            </div>

            {item.available && (
                <div className="card-arrow" style={{ color: item.color }}>
                    →
                </div>
            )}
        </div>
    );
}

export default DashboardCard;