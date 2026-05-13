const express = require('express');
const router = express.Router();
const Cinema = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// Get all cinemas - public
router.get('/cinemas', async (req, res) => {
    try {
        const cinemas = await Cinema.find({});
        res.json(cinemas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create cinema
router.post('/cinemas', protect, admin, async (req, res) => {
    try {
        const cinema = new Cinema(req.body);
        await cinema.save();
        res.status(201).json(cinema);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get rooms by cinema
router.get('/cinemas/:cinemaId/rooms', protect, admin, async (req, res) => {
    try {
        const rooms = await CinemaRoom.find({ cinema: req.params.cinemaId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create room
router.post('/rooms', protect, admin, async (req, res) => {
    try {
        const room = new CinemaRoom(req.body);
        await room.save();
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Revenue report
router.get('/reports/revenue', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const match = { status: 'paid' };
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const revenue = await Booking.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                    totalBookings: { $sum: 1 }
                }
            }
        ]);

        res.json(revenue[0] || { totalRevenue: 0, totalBookings: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Occupancy rate
router.get('/reports/occupancy', protect, admin, async (req, res) => {
    try {
        const showtimes = await Showtime.find({ status: 'active' });
        const occupancy = showtimes.map(st => ({
            showtimeId: st._id,
            occupied: st.totalSeats - st.availableSeats,
            total: st.totalSeats,
            percentage: ((st.totalSeats - st.availableSeats) / st.totalSeats * 100).toFixed(2)
        }));
        res.json(occupancy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Top movies
router.get('/reports/top-movies', protect, admin, async (req, res) => {
    try {
        const topMovies = await Booking.aggregate([
            { $match: { status: 'paid' } },
            { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtime' } },
            { $unwind: '$showtime' },
            { $lookup: { from: 'movies', localField: 'showtime.movie', foreignField: '_id', as: 'movie' } },
            { $unwind: '$movie' },
            { $group: { _id: '$movie._id', title: { $first: '$movie.title' }, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);
        res.json(topMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Booking stats
router.get('/reports/bookings', protect, admin, async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalPrice', 0] } } } }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all showtimes (admin)
router.get('/showtimes', protect, admin, async (req, res) => {
    try {
        const { movieId, cinemaId } = req.query;
        const filter = {};
        if (movieId) filter.movie = movieId;
        if (cinemaId) filter.cinema = cinemaId;

        const showtimes = await Showtime.find(filter)
            .populate('movie', 'title poster')
            .populate('cinema', 'name')
            .populate('room', 'name')
            .sort({ date: -1, startTime: 1 })
            .limit(200);
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all bookings (admin)
router.get('/bookings', protect, admin, async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate('user', 'name email')
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title poster' },
                    { path: 'cinema', select: 'name address' }
                ]
            })
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
