require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { startExpireBookingsJob } = require('./jobs/expire-bookings');
const { startExpireShowtimesJob } = require('./jobs/expire-showtimes');
const { startReminderEmailsJob } = require('./jobs/send-reminder-emails');
const { Server } = require('socket.io');
const { initNotificationService } = require('./services/notification-service');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
    },
});

io.on('connection', (socket) => {
    socket.on('admin:join', () => socket.join('admins'));
});
initNotificationService(io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/showtimes', require('./routes/showtimes'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments/momo', require('./routes/momo'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => res.send('Cinema Clone Backend API'));

app.use((req, res) => res.status(404).json({ message: `Cannot ${req.method} ${req.url}` }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExpireBookingsJob();
    startExpireShowtimesJob();
    startReminderEmailsJob();
});
