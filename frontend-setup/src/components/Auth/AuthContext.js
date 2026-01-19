import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, setToken, removeToken } from '../../utils/api';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        
        if (token) {
            try {
                // Verify token is still valid by getting current user
                const response = await authAPI.getCurrentUser();
                if (response.success) {
                    setCurrentUser(response.user);
                } else {
                    // Token invalid, clear it
                    removeToken();
                    localStorage.removeItem('currentUser');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                removeToken();
                localStorage.removeItem('currentUser');
            }
        }
        
        setLoading(false);
    };

    // Register new user
    const register = async (email, password, firstName, lastName) => {
        try {
            const response = await authAPI.register({
                email,
                password,
                firstName,
                lastName
            });

            if (response.success) {
                // Save token
                setToken(response.token);
                
                // Save user data
                const userData = response.user;
                localStorage.setItem('currentUser', JSON.stringify(userData));
                setCurrentUser(userData);
                
                return { success: true };
            } else {
                return { success: false, error: response.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message || 'Registration failed' };
        }
    };

    // Login
    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });

            if (response.success) {
                // Save token
                setToken(response.token);
                
                // Save user data
                const userData = response.user;
                localStorage.setItem('currentUser', JSON.stringify(userData));
                setCurrentUser(userData);
                
                return { success: true };
            } else {
                return { success: false, error: response.message || 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Login failed' };
        }
    };

    // Logout
    const logout = () => {
        removeToken();
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        register,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}