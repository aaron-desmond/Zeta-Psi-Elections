import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="nav-logo">
                    <span className="logo-icon">🗳️</span>
                    <span className="logo-text">Elections</span>
                </div>
                <div className="nav-actions">
                    <button onClick={() => navigate('/login')} className="nav-btn login">
                        Log In
                    </button>
                    <button onClick={() => navigate('/register')} className="nav-btn register">
                        Get Started
                    </button>
                </div>
            </nav>

            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Modern Election Management
                        <span className="gradient-text"> Made Simple</span>
                    </h1>
                    <p className="hero-subtitle">
                        Run secure, transparent elections for your fraternity or organization. 
                        Multi-round voting, real-time results, and complete transparency.
                    </p>
                    <div className="hero-actions">
                        <button onClick={() => navigate('/register')} className="cta-btn primary">
                            Get Started Free
                            <span className="arrow">→</span>
                        </button>
                        <button onClick={() => navigate('/login')} className="cta-btn secondary">
                            Log In
                        </button>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="visual-card card-1">
                        <div className="card-icon">📊</div>
                        <div className="card-title">Live Results</div>
                        <div className="card-desc">Real-time vote tracking</div>
                    </div>
                    <div className="visual-card card-2">
                        <div className="card-icon">🔒</div>
                        <div className="card-title">Secure</div>
                        <div className="card-desc">One vote per member</div>
                    </div>
                    <div className="visual-card card-3">
                        <div className="card-icon">⚡</div>
                        <div className="card-title">Fast</div>
                        <div className="card-desc">Results in seconds</div>
                    </div>
                </div>
            </section>

            <section className="features">
                <h2 className="section-title">Everything You Need</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🗳️</div>
                        <h3>Multi-Round Voting</h3>
                        <p>Automatic runoff elections if no candidate reaches the 2/3 majority threshold.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📋</div>
                        <h3>Easy Applications</h3>
                        <p>Members submit applications with photos and statements directly through the platform.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3>Chapter Management</h3>
                        <p>Create or join chapters with unique codes. Complete data isolation between chapters.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Live Results</h3>
                        <p>Watch vote counts update in real-time. See percentage breakdowns and threshold indicators.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🏛️</div>
                        <h3>Admin Dashboard</h3>
                        <p>Control elections, manage positions, and oversee the entire process from one place.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">✅</div>
                        <h3>Transparent</h3>
                        <p>Every member can see results. Previous winners are clearly marked in multi-round elections.</p>
                    </div>
                </div>
            </section>

            <section className="how-it-works">
                <h2 className="section-title">How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Create or Join Chapter</h3>
                        <p>Register and either create a new chapter or join your existing organization with a chapter code.</p>
                    </div>
                    <div className="step-arrow">→</div>

                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Submit Applications</h3>
                        <p>Members apply for positions by uploading a photo and writing a candidate statement.</p>
                    </div>
                    <div className="step-arrow">→</div>

                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Vote & View Results</h3>
                        <p>Admin starts elections, members vote once per round, and results update live until a winner is declared.</p>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Run Your Elections?</h2>
                    <p>Join organizations already using our platform for transparent, secure elections.</p>
                    <button onClick={() => navigate('/register')} className="cta-btn primary large">
                        Get Started Now
                        <span className="arrow">→</span>
                    </button>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <span className="logo-icon">🗳️</span>
                        <span className="logo-text">Elections</span>
                    </div>
                    <p className="footer-text">
                        Modern election management for fraternities and organizations.
                    </p>
                    <div className="footer-links">
                        <button onClick={() => navigate('/login')} className="footer-link">Log In</button>
                        <button onClick={() => navigate('/register')} className="footer-link">Get Started</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;