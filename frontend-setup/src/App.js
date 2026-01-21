import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/Auth/AuthContext';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import Navigation from './components/Layout/Navigation';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import PositionsList from './components/Positions/PositionsList';
import ApplicationForm from './components/Application/ApplicationForm'; 
import MyApplications from './components/Application/MyApplications';
import BrowseCandidates from './components/Candidates/BrowseCandidates';
import AdminDashboard from './components/Admin/AdminDashboard';
import ManagePositions from './components/Admin/ManagePositions';  
import PositionForm from './components/Admin/PositionForm';
import StartElections from './components/Admin/StartElections';
import LiveResults from './components/Admin/LiveResults'; 
import VotingDashboard from './components/Voting/VotingDashboard';
import VotingInterface from './components/Voting/VotingInterface'; 
import LandingPage from './components/Landing/LandingPage';
import './App.css';

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const { currentUser } = useAuth();
    return currentUser ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const { currentUser } = useAuth();
    
    if (!currentUser) {
        return <Navigate to="/login" />;
    }
    
    if (!currentUser.isAdmin) {
        return <Navigate to="/dashboard" />;
    }
    
    return children;
}

function AppRoutes() {
    const { currentUser } = useAuth();

    return (
        <>
            {currentUser && <Navigation />}
            <Routes>
                <Route path="/" element={
                    currentUser ? <Navigate to="/dashboard" /> : <LandingPage />
                } />
                <Route path="/login" element={
                    <Login />
                } />
                <Route path="/register" element={
                    <Register />
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/positions" element={
                    <ProtectedRoute>
                        <PositionsList />
                    </ProtectedRoute>
                } />
                <Route path="/apply" element={
                    <ProtectedRoute>
                        <ApplicationForm />
                    </ProtectedRoute>
                } />
                <Route path="/my-applications" element={
                    <ProtectedRoute>
                        <MyApplications />
                    </ProtectedRoute>
                } />
                <Route path="/candidates" element={
                    <ProtectedRoute>
                        <BrowseCandidates />
                    </ProtectedRoute>
                } />
                <Route path="/apply" element={
                    <ProtectedRoute>
                        <ApplicationForm />
                    </ProtectedRoute>
                } />
                <Route path="/apply/edit" element={
                    <ProtectedRoute>
                        <ApplicationForm />
                    </ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <AdminRoute>
                        <AdminDashboard />
                    </AdminRoute>
                } />
                <Route path="/admin/positions" element={
                    <AdminRoute>
                        <ManagePositions />
                    </AdminRoute>
                } />
                <Route path="/admin/positions/create" element={
                    <AdminRoute>
                        <PositionForm />
                    </AdminRoute>
                } />
                <Route path="/admin/positions/edit" element={
                    <AdminRoute>
                        <PositionForm />
                    </AdminRoute>
                } />
                <Route path="/admin/elections" element={
                    <AdminRoute>
                        <StartElections />
                    </AdminRoute>
                } />
                <Route path="/admin/elections/live/:positionId" element={
                    <AdminRoute>
                        <LiveResults />
                    </AdminRoute>
                } />
                <Route path="/vote" element={
                    <ProtectedRoute>
                        <VotingDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/vote/:positionId" element={
                    <ProtectedRoute>
                        <VotingInterface />
                    </ProtectedRoute>
                } />
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <AnimatedBackground />
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;