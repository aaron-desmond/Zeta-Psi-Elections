import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';
import './Navigation.css';

function Navigation() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!currentUser) return null;

    return (
        <nav className="navigation">
            <div className="nav-container">
                <Link to="/dashboard" className="nav-logo">
                    <span className="logo-icon">ΖΨ</span>
                    <span className="logo-text">Elections</span>
                </Link>

                <div className="nav-menu">
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/positions" className="nav-link">Positions</Link>
                    <Link to="/candidates" className="nav-link">Candidates</Link>
                    <Link to="/vote" className="nav-link">Vote</Link>
                    <Link to="/my-applications" className="nav-link">My Applications</Link>
                    {currentUser.isAdmin && (
                        <Link to="/admin" className="nav-link admin-link">Admin</Link>
                    )}
                </div>

                <div className="nav-user">
                    <span className="user-name">
                        {currentUser.firstName}
                        {currentUser.isAdmin && <span className="admin-badge">Admin</span>}
                    </span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navigation;