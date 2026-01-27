const http = require('http');
const { Server } = require('socket.io');

const app = require('./app'); // express app

// === IMPORT ROUTES ===
const authRoute = require('./router/auth.route');
const userRoute = require('./router/user.route');
const staffRoute = require('./router/staff.route');
const movieRoute = require('./router/movie.route');
const bookingRoute = require('./router/booking.route');
const cinemaRoute = require('./router/cinema.route');
const genreRoute = require('./router/genre.route');
const roomRoute = require('./router/room.route');
const comboRoute = require('./router/combo.route');
const paymentRoute = require('./router/payment.route');
const adminRoute = require('./router/admin.route');

// === SETUP HTTP SERVER & SOCKET.IO ===
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Make io accessible to routes
app.set('io', io);

// === REGISTER ROUTES ===
app.use('/api/auth', authRoute);
app.use('/api/users', userRoute);
app.use('/api/staff', staffRoute);
app.use('/api/movies', movieRoute);
app.use('/api/booking', bookingRoute);
app.use('/api/cinemas', cinemaRoute);
app.use('/api/genres', genreRoute);
app.use('/api/rooms', roomRoute);
app.use('/api/combos', comboRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/admin', adminRoute);

// === SOCKET.IO EVENTS ===
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Join showtime room for real-time seat updates
    socket.on('joinShowtime', (showtimeId) => {
        socket.join(showtimeId);
        console.log(`📍 Client ${socket.id} joined showtime: ${showtimeId}`);
    });

    // Leave showtime room
    socket.on('leaveShowtime', (showtimeId) => {
        socket.leave(showtimeId);
        console.log(`📍 Client ${socket.id} left showtime: ${showtimeId}`);
    });

    // Emit when seat is being held
    socket.on('holdSeat', ({ showtimeId, seatCode, userId }) => {
        io.to(showtimeId).emit('seatHolding', {
            seatCode,
            status: 'holding',
            userId
        });
    });

    // Emit when seat is booked
    socket.on('bookSeat', ({ showtimeId, seatCode }) => {
        io.to(showtimeId).emit('seatBooked', {
            seatCode,
            status: 'booked'
        });
    });

    // Emit when seat hold is released
    socket.on('releaseSeat', ({ showtimeId, seatCode }) => {
        io.to(showtimeId).emit('seatAvailable', {
            seatCode,
            status: 'available'
        });
    });

    // Update seat layout in real-time
    socket.on('updateSeats', ({ showtimeId, seats }) => {
        io.to(showtimeId).emit('seatsUpdated', seats);
    });

    // Handle seat release on disconnect
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });

    // Error handling
    socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
    });
});

// === START SERVER ===
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🎬 5CINE BACKEND SERVER STARTED    ║
║   Port: ${PORT}                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}           ║
║   Database: Connected to MongoDB     ║
╚═══════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = server;