import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validatePassword = (password) => {
        // Check length
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }

        // Check for at least one number
        if (!/\d/.test(password)) {
            return 'Password must contain at least one number';
        }

        // Check for at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
        }

        return null; // Password is valid
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validate password
            const passwordError = validatePassword(formData.password);
            if (passwordError) {
                setError(passwordError);
                setLoading(false);
                return;
            }

            // Check if passwords match
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }

            // Register user
            const result = await register(formData.email, formData.password, formData.firstName, formData.lastName);
            
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            setError('An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Create Account</h1>
                <p className="auth-subtitle">Join the election process</p>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your.email@example.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter strong password"
                            required
                            disabled={loading}
                        />
                        <div className="password-requirements">
                            <small>Password must contain:</small>
                            <ul>
                                <li className={formData.password.length >= 8 ? 'valid' : ''}>
                                    At least 8 characters
                                </li>
                                <li className={/\d/.test(formData.password) ? 'valid' : ''}>
                                    At least 1 number
                                </li>
                                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'valid' : ''}>
                                    At least 1 special character (!@#$%^&*, etc.)
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;