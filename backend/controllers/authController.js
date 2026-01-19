const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            isAdmin: user.is_admin 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Register new user
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        db.get('SELECT id FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            const query = `
                INSERT INTO users (email, password, first_name, last_name, is_admin)
                VALUES (?, ?, ?, ?, 0)
            `;

            db.run(query, [email, hashedPassword, firstName, lastName], function(err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create user',
                        error: err.message
                    });
                }

                // Get the created user
                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, user) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'User created but failed to retrieve',
                            error: err.message
                        });
                    }

                    // Generate token
                    const token = generateToken(user);

                    res.status(201).json({
                        success: true,
                        message: 'User registered successfully',
                        token,
                        user: {
                            id: user.id,
                            email: user.email,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            isAdmin: user.is_admin === 1
                        }
                    });
                });
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Generate token
            const token = generateToken(user);

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isAdmin: user.is_admin === 1
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get current user (verify token)
exports.getCurrentUser = (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                isAdmin: user.is_admin === 1
            }
        });
    });
};