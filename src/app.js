const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

// === ENVIRONMENT VARIABLES ===
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// === MIDDLEWARE ===
// CORS Configuration
const corsOptions = {
    origin: FRONTEND_URL.split(',').map(url => url.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Logging middleware
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// === CONNECT DATABASE ===
connectDB();

// === HEALTH CHECK ===
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running ✅',
        timestamp: new Date(),
        environment: NODE_ENV
    });
});

// === ROOT ENDPOINT ===
app.get('/', (req, res) => {
    res.json({
        message: '🎬 Welcome to 5CINE API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            movies: '/api/movies',
            cinemas: '/api/cinemas',
            booking: '/api/booking',
            users: '/api/users',
            admin: '/api/admin'
        }
    });
});

// === API ROUTES ===
// Routes will be registered in server.js

// === 404 ERROR HANDLER ===
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date()
    });
});

// === ERROR HANDLING MIDDLEWARE ===
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Validation error from Joi
    if (err.isJoi) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            details: err.details?.map(d => ({
                field: d.path.join('.'),
                message: d.message
            })) || []
        });
    }

    // MongoDB validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    // Generic error response
    res.status(status).json({
        success: false,
        message,
        ...(NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
