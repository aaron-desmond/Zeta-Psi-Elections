import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import { applicationsAPI } from '../../utils/api';
import { getNextFourTerms } from '../../utils/termCalculator';
import './Application.css';

function ApplicationForm() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const position = location.state?.position;
    const existingApplication = location.state?.application; // For editing
    const isEditMode = !!existingApplication;

    const [formData, setFormData] = useState({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        photo: existingApplication?.photoPath ? null : null,
        photoPreview: existingApplication?.photoPath ? `http://localhost:5001${existingApplication.photoPath}` : null,
        statement: existingApplication?.statement || '',
        terms: existingApplication?.terms || []
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const availableTerms = getNextFourTerms();

    // If creating new application and no position selected, redirect back
    if (!isEditMode && !position) {
        navigate('/positions');
        return null;
    }

    // Get position info (either from route state or from existing application)
    const currentPosition = isEditMode 
        ? { title: existingApplication.positionTitle, description: '', id: existingApplication.positionId }
        : position;

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors({ ...errors, photo: 'Please upload an image file' });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors({ ...errors, photo: 'Image must be smaller than 5MB' });
                return;
            }

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    photo: file,
                    photoPreview: reader.result
                });
                setErrors({ ...errors, photo: null });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTermToggle = (termValue) => {
        setFormData(prev => {
            const currentTerms = prev.terms;
            if (currentTerms.includes(termValue)) {
                return {
                    ...prev,
                    terms: currentTerms.filter(t => t !== termValue)
                };
            } else {
                return {
                    ...prev,
                    terms: [...currentTerms, termValue]
                };
            }
        });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.photo && !formData.photoPreview) {
            newErrors.photo = 'Please upload a photo';
        }

        if (!formData.statement || formData.statement.trim().length === 0) {
            newErrors.statement = 'Please provide a statement';
        }

        if (formData.terms.length === 0) {
            newErrors.terms = 'Please select at least one term';
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

            const applicationData = {
                positionId: currentPosition.id,
                statement: formData.statement.trim(),
                terms: formData.terms,
                photo: formData.photo // The actual file object
            };

            let response;
            if (isEditMode) {
                // Update existing application
                response = await applicationsAPI.update(existingApplication.id, applicationData);
                alert('Application updated successfully!');
            } else {
                // Submit new application
                response = await applicationsAPI.submit(applicationData);
                alert('Application submitted successfully!');
            }

            if (response.success) {
                navigate('/my-applications');
            } else {
                alert('Failed to submit application: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            alert('Failed to submit application: ' + (error.message || 'Network error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="application-container">
            <div className="application-header">
                <h1>{isEditMode ? 'Edit' : 'Apply for'} {currentPosition.title}</h1>
                {currentPosition.description && (
                    <p className="application-subtitle">{currentPosition.description}</p>
                )}
            </div>

            <div className="application-form">
                <form onSubmit={handleSubmit}>
                    {/* Name Section */}
                    <div className="form-section">
                        <h2>Personal Information</h2>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    disabled
                                    className="disabled-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    disabled
                                    className="disabled-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="form-section">
                        <h2>Profile Photo *</h2>
                        <p className="section-description">Upload a clear photo of yourself</p>

                        <div className="photo-upload-container">
                            {formData.photoPreview ? (
                                <div className="photo-preview">
                                    <img src={formData.photoPreview} alt="Preview" />
                                    <button
                                        type="button"
                                        className="remove-photo-btn"
                                        onClick={() => setFormData({ ...formData, photo: null, photoPreview: null })}
                                        disabled={loading}
                                    >
                                        Remove Photo
                                    </button>
                                </div>
                            ) : (
                                <div className="photo-upload-box">
                                    <input
                                        type="file"
                                        id="photo-upload"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="photo-input"
                                        disabled={loading}
                                    />
                                    <label htmlFor="photo-upload" className="photo-upload-label">
                                        <div className="upload-icon">📷</div>
                                        <div className="upload-text">
                                            <strong>Click to upload photo</strong>
                                            <p>JPG, PNG or GIF (max 5MB)</p>
                                        </div>
                                    </label>
                                </div>
                            )}
                            {errors.photo && <div className="error-text">{errors.photo}</div>}
                        </div>
                    </div>

                    {/* Statement */}
                    <div className="form-section">
                        <h2>Statement *</h2>
                        <p className="section-description">
                            Why do you want to run for this position? What makes you qualified for this role?
                        </p>

                        <div className="form-group">
                            <textarea
                                value={formData.statement}
                                onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                                placeholder="Share your motivation, vision, and what qualifies you for this position..."
                                rows="10"
                                className={errors.statement ? 'error' : ''}
                                disabled={loading}
                            />
                            {errors.statement && <div className="error-text">{errors.statement}</div>}
                        </div>
                    </div>

                    {/* Term Selection */}
                    <div className="form-section">
                        <h2>Select Terms *</h2>
                        <p className="section-description">
                            Choose which term(s) you will be available to serve
                        </p>

                        <div className="terms-grid">
                            {availableTerms.map((term) => (
                                <label key={term.value} className="term-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={formData.terms.includes(term.value)}
                                        onChange={() => handleTermToggle(term.value)}
                                        disabled={loading}
                                    />
                                    <span className="term-label">{term.label}</span>
                                </label>
                            ))}
                        </div>
                        {errors.terms && <div className="error-text">{errors.terms}</div>}
                    </div>

                    {/* Submit */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-back"
                            onClick={() => navigate(isEditMode ? '/my-applications' : '/positions')}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading 
                                ? 'Submitting...' 
                                : isEditMode ? 'Update Application' : 'Submit Application'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ApplicationForm;