const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

// === MIDDLEWARE ===
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === CONNECT DATABASE ===
connectDB();

// === HEALTH CHECK ===
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running ✅' });
});

// === ERROR HANDLING ===
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

module.exports = app;
