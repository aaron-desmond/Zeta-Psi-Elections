require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const initDatabase = require('./utils/initDatabase');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const positionsRoutes = require('./routes/positions');
const applicationsRoutes = require('./routes/applications');
const electionsRoutes = require('./routes/elections');
const votingRoutes = require('./routes/voting');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/positions', positionsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/elections', electionsRoutes);
app.use('/api/voting', votingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Other errors
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🏛️  Fraternity Election System - Backend API       ║
║                                                        ║
║   Server running on port ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}                                ║
║   Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}               ║
║                                                        ║
║   API Base: http://localhost:${PORT}/api               ║
║   Health Check: http://localhost:${PORT}/api/health    ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
            `);
        });
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

module.exports = app;