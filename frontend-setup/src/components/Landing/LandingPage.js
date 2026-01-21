import React from 'react';
import { useNavigate } from 'react-router-dom';
import liveResultsIcon from '../../Images/Landing_Live_Results_Image.png';
import secureIcon from '../../Images/Landing_Secure_Image.png';
import fastSetupIcon from '../../Images/Landing_Fast_Setup_Image.png';
import multiRoundVotingIcon from '../../Images/Landing_Multi_Round_Voting_Image.png';
import easyApplicationsIcon from '../../Images/Landing_Easy_Applications_Image.png';
import organizedPlatformIcon from '../../Images/Landing_Organized_Platform_Image.png';
import adminDashboardIcon from '../../Images/Landing_Admin_Dashboard_Image.png';
import transparentProcessIcon from '../../Images/Landing_Transparent_Process_Image.png';
import './LandingPage.css';


function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="nav-logo">
                    <span className="logo-icon">ΖΨ</span>
                    <span className="logo-text">Zeta Psi Elections</span>
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
                        Zeta Psi Elections
                    </h1>
                    <p className="hero-subtitle">
                        Modern election management for the brotherhood. 
                        Run secure, transparent elections with multi-round voting and real-time results.
                    </p>
                    <div className="hero-actions">
                        <button onClick={() => navigate('/register')} className="cta-btn primary">
                            Get Started
                            <span className="arrow">→</span>
                        </button>
                        <button onClick={() => navigate('/login')} className="cta-btn secondary">
                            Member Login
                        </button>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="visual-card card-1">
                        <div className="card-icon">
                            <img src={liveResultsIcon} alt="📊" />
                        </div>
                        <div className="card-title">Live Results</div>
                        <div className="card-desc">Real-time vote tracking</div>
                    </div>
                    <div className="visual-card card-2">
                        <div className="card-icon">
                            <img src={secureIcon} alt="🔒" />
                        </div>
                        <div className="card-title">Secure</div>
                        <div className="card-desc">One vote per brother</div>
                    </div>
                    <div className="visual-card card-3">
                        <div className="card-icon">
                            <img src={fastSetupIcon} alt="⚡" />
                        </div>
                        <div className="card-title">Fast Setup</div>
                        <div className="card-desc">Results in seconds</div>
                    </div>
                </div>
            </section>

            <section className="features">
                <div className="section-header">
                    <h2 className="section-title">Built for the Brotherhood</h2>
                </div>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <img src={multiRoundVotingIcon} alt="🗳️" />
                        </div>
                        <h3>Multi-Round Voting</h3>
                        <p>Automatic runoff elections if no candidate reaches the 2/3 majority threshold required by your chapter.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <img src={easyApplicationsIcon} alt="📋" />
                        </div>
                        <h3>Easy Applications</h3>
                        <p>Brothers submit applications with photos and statements directly through the platform.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <img src={organizedPlatformIcon} alt="👥" />
                        </div>
                        <h3>Organized Platform</h3>
                        <p>Manage applications, vote, and view others' statements all in one place.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <img src={liveResultsIcon} alt="📊" />
                        </div>
                        <h3>Live Results</h3>
                        <p>Watch vote counts update in real-time with percentage breakdowns and threshold indicators.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <img src={adminDashboardIcon} alt="🏛️" />
                        </div>
                        <h3>Admin Dashboard</h3>
                        <p>Control elections, manage positions, and oversee the entire process from one centralized dashboard.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <img src={transparentProcessIcon} alt="✅" />
                        </div>
                        <h3>Transparent Process</h3>
                        <p>Every brother can see results in real-time. Previous winners are clearly marked in multi-round elections.</p>
                    </div>
                </div>
            </section>

            <section className="how-it-works">
                <div className="section-header">
                    <h2 className="section-title">How It Works</h2>
                </div>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Create Account</h3>
                        <p>Register with your email and join your Zeta Psi chapter's election system.</p>
                    </div>
                    <div className="step-arrow">→</div>

                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Submit Applications</h3>
                        <p>Apply for open positions by uploading a photo and writing your candidate statement.</p>
                    </div>
                    <div className="step-arrow">→</div>

                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Vote & View Results</h3>
                        <p>Admin starts elections, brothers vote once per round, and results update live until a winner is declared.</p>
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready for Your Chapter Elections?</h2>
                    <p>Click Get Started now to begin using our platform for transparent, secure elections.</p>
                    <button onClick={() => navigate('/register')} className="cta-btn primary large">
                        Get Started Now
                        <span className="arrow">→</span>
                    </button>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <span className="logo-icon">ΖΨ</span>
                        <span className="logo-text">Zeta Psi Elections</span>
                    </div>
                    <p className="footer-text">
                        Modern election management for Zeta Psi, Psi Eplison Chapter.
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