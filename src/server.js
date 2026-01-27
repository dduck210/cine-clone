const http = require('http');
const { Server } = require('socket.io');

const app = require('./app'); // express app

// === IMPORT ROUTES ===
const authRoute = require('./routes/auth.route');
const userRoute = require('./routes/user.route');
const staffRoute = require('./routes/staff.route');
const movieRoute = require('./routes/movie.route');
const bookingRoute = require('./routes/booking.route');
const cinemaRoute = require('./routes/cinema.route');
const genreRoute = require('./routes/genre.route');
const roomRoute = require('./routes/room.route');
const comboRoute = require('./routes/combo.route');
const paymentRoute = require('./routes/payment.route');
const adminRoute = require('./routes/admin.route');

// === SETUP HTTP SERVER & SOCKET.IO ===
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

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
        console.log(`Client ${socket.id} joined showtime: ${showtimeId}`);
    });

    // Emit when seat is being held
    socket.on('holdSeat', ({ showtimeId, seatCode }) => {
        socket.to(showtimeId).emit('seatHolding', {
            seatCode,
            status: 'holding',
            userId: socket.id
        });
    });

    // Emit when seat is booked
    socket.on('bookSeat', ({ showtimeId, seatCode }) => {
        socket.to(showtimeId).emit('seatBooked', {
            seatCode,
            status: 'booked'
        });
    });

    // Emit when seat hold is released
    socket.on('releaseSeat', ({ showtimeId, seatCode }) => {
        socket.to(showtimeId).emit('seatAvailable', {
            seatCode,
            status: 'available'
        });
    });

    // Update seat layout in real-time
    socket.on('updateSeats', ({ showtimeId, seats }) => {
        socket.to(showtimeId).emit('seatsUpdated', seats);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

module.exports = server;