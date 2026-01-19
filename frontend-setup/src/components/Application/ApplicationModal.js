import React from 'react';
import './ApplicationModal.css';

function ApplicationModal({ application, onClose }) {
    if (!application) return null;

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

    // Handle both old photoPreview (base64) and new photoPath (backend URL)
    const photoUrl = application.photoPreview 
        ? application.photoPreview 
        : application.photoPath 
            ? `http://localhost:5001${application.photoPath}`
            : null;

    // Handle both old 'position' field and new 'positionTitle' field
    const positionTitle = application.positionTitle || application.position;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                
                <div className="modal-header">
                    <div className="modal-header-content">
                        <h2>{positionTitle}</h2>
                        <span className="app-status pending">Pending Review</span>
                    </div>
                    {photoUrl && (
                        <img 
                            src={photoUrl}
                            alt={`${application.firstName} ${application.lastName}`}
                            className="modal-photo"
                        />
                    )}
                </div>

                <div className="modal-body">
                    <div className="modal-section">
                        <h3>Applicant Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <strong>Name:</strong>
                                <span>{application.firstName} {application.lastName}</span>
                            </div>
                            <div className="info-item">
                                <strong>Submitted:</strong>
                                <span>{formatDate(application.submittedAt)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-section">
                        <h3>Terms Available</h3>
                        <div className="terms-display">
                            {application.terms && application.terms.map((term, idx) => (
                                <span key={idx} className="term-badge-large">{term}</span>
                            ))}
                        </div>
                    </div>

                    <div className="modal-section">
                        <h3>Statement</h3>
                        <div className="statement-display">
                            <p>{application.statement}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationModal;