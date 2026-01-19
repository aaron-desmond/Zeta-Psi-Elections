import React from 'react';
import './BarGraph.css';

function BarGraph({ candidates, totalVotes, requiredVotes }) {
    if (candidates.length === 0 || totalVotes === 0) {
        return null;
    }

    // Calculate threshold position as percentage of total votes
    const thresholdHeightPercent = (requiredVotes / totalVotes) * 100;

    return (
        <div className="bar-graph-container">
            <h2>📊 Vote Distribution</h2>
            
            <div className="bar-graph-wrapper">
                <div className="bar-graph">
                    {/* Threshold line positioned inside graph */}
                    <div 
                        className="global-threshold-line"
                        style={{ bottom: `${thresholdHeightPercent}%` }}
                    >
                        <div className="global-threshold-label">
                            2/3 Required ({requiredVotes} votes)
                        </div>
                    </div>

                    {candidates.map((candidate, index) => {
                        // Calculate height as percentage of TOTAL votes (not max votes)
                        const heightPercentage = (candidate.voteCount / totalVotes) * 100;
                        const meetsThreshold = candidate.voteCount >= requiredVotes;
                        
                        return (
                            <div key={index} className="bar-column">
                                <div className="bar-wrapper">
                                    {candidate.voteCount > 0 ? (
                                        <div 
                                            className={`bar ${meetsThreshold ? 'meets-threshold' : ''}`}
                                            style={{ height: `${heightPercentage}%` }}
                                        >
                                            <div className="bar-value">
                                                <div className="vote-count">{candidate.voteCount}</div>
                                                <div className="vote-percentage">{candidate.percentage}%</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bar bar-empty">
                                            <div className="bar-value">
                                                <div className="vote-count">0</div>
                                                <div className="vote-percentage">0%</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bar-info">
                                    {candidate.photoPreview && (
                                        <img 
                                            src={candidate.photoPreview} 
                                            alt={`${candidate.firstName} ${candidate.lastName}`}
                                            className="candidate-photo-small"
                                        />
                                    )}
                                    <div className="candidate-name">
                                        {candidate.firstName} {candidate.lastName}
                                    </div>
                                    {meetsThreshold && candidate.voteCount > 0 && (
                                        <div className="threshold-badge">✓ Majority</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="graph-legend">
                <div className="legend-item">
                    <div className="legend-color gold"></div>
                    <span>Below 2/3 Threshold</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color green"></div>
                    <span>Meets 2/3 Majority</span>
                </div>
                <div className="legend-item threshold-line-legend">
                    <div className="legend-line"></div>
                    <span>2/3 Majority Line ({requiredVotes} votes)</span>
                </div>
            </div>
        </div>
    );
}

export default BarGraph;