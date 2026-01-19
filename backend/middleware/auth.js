const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Protect routes - verify JWT token
const protect = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database to ensure they still exist
        db.get(
            'SELECT id, email, first_name, last_name, is_admin FROM users WHERE id = ?',
            [decoded.id],
            (err, user) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database error during authentication'
                    });
                }

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not found'
                    });
                }

                // Add user info to request
                req.user = {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isAdmin: user.is_admin === 1
                };

                next();
            }
        );
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired' 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication' 
        });
    }
};

// Admin only middleware
const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({ 
            success: false, 
            message: 'Admin access required' 
        });
    }

    next();
};

module.exports = { protect, admin };