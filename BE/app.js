require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { startExpireBookingsJob } = require('./jobs/expire-bookings');
const { startExpireShowtimesJob } = require('./jobs/expire-showtimes');
const { startUpcomingReminderJob } = require('./jobs/send-upcoming-reminders');

dotenv.config();
connectDB();

const app = express();

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
app.use('/api/reviews', require('./routes/reviews'));

app.get('/', (req, res) => res.send('Cinema Clone Backend API'));

app.use((req, res) => res.status(404).json({ message: `Cannot ${req.method} ${req.url}` }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExpireBookingsJob();
    startExpireShowtimesJob();
    startUpcomingReminderJob();
});
