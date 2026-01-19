import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { positionsAPI } from '../../utils/api';
import './PositionForm.css';

function PositionForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const existingPosition = location.state?.position;
    const isEditMode = !!existingPosition;

    const [formData, setFormData] = useState({
        title: existingPosition?.title || '',
        description: existingPosition?.description || '',
        responsibilities: existingPosition?.responsibilities || [''],
        isExecutive: existingPosition?.isExecutive || false,
        numberOfPositions: existingPosition?.numberOfPositions || 1
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        setErrors({ ...errors, [field]: null });
    };

    const handleResponsibilityChange = (index, value) => {
        const updated = [...formData.responsibilities];
        updated[index] = value;
        setFormData({ ...formData, responsibilities: updated });
    };

    const addResponsibility = () => {
        setFormData({
            ...formData,
            responsibilities: [...formData.responsibilities, '']
        });
    };

    const removeResponsibility = (index) => {
        if (formData.responsibilities.length > 1) {
            const updated = formData.responsibilities.filter((_, i) => i !== index);
            setFormData({ ...formData, responsibilities: updated });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Position title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        const validResponsibilities = formData.responsibilities.filter(r => r.trim());
        if (validResponsibilities.length === 0) {
            newErrors.responsibilities = 'At least one responsibility is required';
        }

        if (formData.numberOfPositions < 1 || formData.numberOfPositions > 10) {
            newErrors.numberOfPositions = 'Number of positions must be between 1 and 10';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            
            // Filter out empty responsibilities
            const cleanedResponsibilities = formData.responsibilities.filter(r => r.trim());

            const positionData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                responsibilities: cleanedResponsibilities,
                isExecutive: formData.isExecutive,
                numberOfPositions: parseInt(formData.numberOfPositions)
            };

            let response;
            if (isEditMode) {
                // Update existing position
                response = await positionsAPI.update(existingPosition.id, positionData);
                alert('Position updated successfully!');
            } else {
                // Create new position
                response = await positionsAPI.create(positionData);
                alert('Position created successfully!');
            }

            if (response.success) {
                navigate('/admin/positions');
            } else {
                alert('Failed to save position: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving position:', error);
            alert('Failed to save position: ' + (error.message || 'Network error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="position-form-container">
            <div className="form-header">
                <h1>{isEditMode ? 'Edit' : 'Create'} Position</h1>
                <p className="form-subtitle">
                    {isEditMode ? 'Update the position details below' : 'Fill out the form to create a new position'}
                </p>
            </div>

            <div className="form-content">
                <form onSubmit={handleSubmit}>
                    {/* Title */}
                    <div className="form-section">
                        <label className="form-label">Position Title *</label>
                        <input
                            type="text"
                            className={`form-input ${errors.title ? 'error' : ''}`}
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g., President, Treasurer, Social Chair"
                            disabled={loading}
                        />
                        {errors.title && <div className="error-text">{errors.title}</div>}
                    </div>

                    {/* Description */}
                    <div className="form-section">
                        <label className="form-label">Description *</label>
                        <textarea
                            className={`form-textarea ${errors.description ? 'error' : ''}`}
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Brief description of the position..."
                            rows="3"
                            disabled={loading}
                        />
                        {errors.description && <div className="error-text">{errors.description}</div>}
                    </div>

                    {/* Number of Positions */}
                    <div className="form-section">
                        <label className="form-label">Number of Positions *</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            className={`form-input ${errors.numberOfPositions ? 'error' : ''}`}
                            value={formData.numberOfPositions}
                            onChange={(e) => handleChange('numberOfPositions', e.target.value)}
                            placeholder="How many people will be elected to this position?"
                            disabled={loading}
                        />
                        <p className="form-helper-text">
                            Set to 1 for single-person positions (President, Treasurer, etc.) or higher for multiple electees (Social Chair: 3, Rush Chair: 4, etc.)
                        </p>
                        {errors.numberOfPositions && <div className="error-text">{errors.numberOfPositions}</div>}
                    </div>

                    {/* Executive Toggle */}
                    <div className="form-section">
                        <label className="checkbox-label-large">
                            <input
                                type="checkbox"
                                checked={formData.isExecutive}
                                onChange={(e) => handleChange('isExecutive', e.target.checked)}
                                disabled={loading}
                            />
                            <span>
                                <strong>⭐ Executive Position</strong>
                                <p className="checkbox-description">
                                    Mark this as an executive position (will display with gold border)
                                </p>
                            </span>
                        </label>
                    </div>

                    {/* Responsibilities */}
                    <div className="form-section">
                        <label className="form-label">Responsibilities *</label>
                        <div className="responsibilities-list">
                            {formData.responsibilities.map((resp, index) => (
                                <div key={index} className="responsibility-item">
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={resp}
                                        onChange={(e) => handleResponsibilityChange(index, e.target.value)}
                                        placeholder={`Responsibility ${index + 1}`}
                                        disabled={loading}
                                    />
                                    {formData.responsibilities.length > 1 && (
                                        <button
                                            type="button"
                                            className="remove-btn"
                                            onClick={() => removeResponsibility(index)}
                                            disabled={loading}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {errors.responsibilities && <div className="error-text">{errors.responsibilities}</div>}
                        <button
                            type="button"
                            className="add-responsibility-btn"
                            onClick={addResponsibility}
                            disabled={loading}
                        >
                            + Add Responsibility
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() => navigate('/admin/positions')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading 
                                ? 'Saving...' 
                                : isEditMode ? 'Update Position' : 'Create Position'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PositionForm;