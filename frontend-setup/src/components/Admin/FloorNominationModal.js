import React, { useState } from 'react';
import { applicationsAPI } from '../../utils/api';
import './FloorNominationModal.css';

function FloorNominationModal({ positions, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        positionId: '',
        firstName: '',
        lastName: '',
        statement: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.positionId || !formData.firstName || !formData.lastName) {
            alert('Please fill in position, first name, and last name');
            return;
        }

        try {
            setLoading(true);
            
            const response = await applicationsAPI.createFloorNomination(
                formData.positionId,
                formData.firstName,
                formData.lastName,
                formData.statement
            );

            if (response.success) {
                alert(`✅ Floor nomination added!\n\n${formData.firstName} ${formData.lastName} has been added as a candidate.`);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert('Failed to create floor nomination: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating floor nomination:', error);
            alert('Failed to create floor nomination: ' + (error.message || 'Network error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Floor Nomination</h2>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="floor-nomination-form">
                    <div className="form-group">
                        <label htmlFor="positionId">Position *</label>
                        <select
                            id="positionId"
                            name="positionId"
                            value={formData.positionId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a position...</option>
                            {positions.map(position => (
                                <option key={position.id} value={position.id}>
                                    {position.title}
                                    {position.isExecutive && ' ⭐'}
                                    {position.numberOfPositions > 1 && ` (${position.numberOfPositions} seats)`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name *</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="John"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Last Name *</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Smith"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="statement">Statement (Optional)</label>
                        <textarea
                            id="statement"
                            name="statement"
                            value={formData.statement}
                            onChange={handleChange}
                            placeholder="Brief statement or reason for nomination..."
                            rows="4"
                        />
                        <span className="helper-text">
                            Optional: Add a brief statement about this nomination
                        </span>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : '✓ Add Nomination'}
                        </button>
                    </div>
                </form>

                <div className="modal-info">
                    <p>
                        <strong>ℹ️ Floor Nominations:</strong> Use this to add candidates who are
                        nominated during the election without a prior application.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default FloorNominationModal;