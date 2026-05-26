require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { startExpireBookingsJob } = require('./jobs/expire-bookings');
const { startExpireShowtimesJob } = require('./jobs/expire-showtimes');
const { startUpcomingReminderJob } = require('./jobs/send-upcoming-reminders');
const { startExpireMoviesJob } = require('./jobs/expire-movies');
const { startUpdateMovieStatusJob } = require('./jobs/update-movie-status');
const { startReviewReminderJob } = require('./jobs/send-review-reminders');
const { Server } = require('socket.io');
const { initNotificationService } = require('./services/notification-service');

dotenv.config();
connectDB();

const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin) || origin.includes('ngrok-free.dev')) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

io.on('connection', (socket) => {
    socket.on('admin:join', () => socket.join('admins'));
});
initNotificationService(io);

app.use(cors(corsOptions));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/api/test-routing', (req, res) => res.json({ message: 'Routing is working!' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/showtimes', require('./routes/showtimes'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments/momo', require('./routes/momo'));
app.use('/api/payments/payos', require('./routes/payos'));
app.use('/api/payments/sepay', require('./routes/sepay'));
app.use('/api/payments/casso', require('./routes/casso'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/push', require('./routes/push'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.get('/', (req, res) => res.send('Cinema Clone Backend API'));

app.use((req, res) => res.status(404).json({ message: `Cannot ${req.method} ${req.url}` }));

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[Fatal Error] ${req.method} ${req.url}:`, err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExpireBookingsJob();
    startExpireShowtimesJob();
    startUpcomingReminderJob();
    startExpireMoviesJob();
    startUpdateMovieStatusJob();
    startReviewReminderJob();
});
