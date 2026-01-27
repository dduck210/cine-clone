const router = require('express').Router();
const Movie = require('../models/movie.model');
const Showtime = require('../models/showtime.model');
const Order = require('../models/order.model');
const Ticket = require('../models/ticket.model');
const Room = require('../models/room.model');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');

// === MOVIE MANAGEMENT ===

// Get all movies (Admin)
router.get('/movies/all', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const movies = await Movie.find().populate('genres');
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create movie
router.post('/movies', verifyToken, authorize('admin'), async (req, res) => {
    const movie = new Movie({
        title: req.body.title,
        description: req.body.description,
        duration: req.body.duration,
        ageLimit: req.body.ageLimit,
        trailerUrl: req.body.trailerUrl,
        posterUrl: req.body.posterUrl,
        genres: req.body.genres,
        director: req.body.director,
        cast: req.body.cast,
        releaseDate: req.body.releaseDate,
        status: req.body.status
    });

    try {
        const newMovie = await movie.save();
        res.status(201).json(newMovie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update movie
router.patch('/movies/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Phim không tìm thấy' });

        Object.assign(movie, req.body);
        const updatedMovie = await movie.save();
        res.json(updatedMovie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Hide/Show movie
router.patch('/movies/:id/status', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Phim không tìm thấy' });

        movie.status = req.body.status;
        await movie.save();
        res.json(movie);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// === SHOWTIME MANAGEMENT ===

// Get all showtimes
router.get('/showtimes', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const showtimes = await Showtime.find()
            .populate('movieId')
            .populate('roomId')
            .populate('cinemaId');
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create showtime (check time overlap)
router.post('/showtimes', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { movieId, roomId, cinemaId, startTime, price } = req.body;

        // Find movie duration
        const movie = await Movie.findById(movieId);
        if (!movie) return res.status(404).json({ message: 'Phim không tìm thấy' });

        const endTime = new Date(new Date(startTime).getTime() + movie.duration * 60000);

        // Check time overlap
        const overlap = await Showtime.findOne({
            roomId,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } }
            ]
        });

        if (overlap) {
            return res.status(400).json({ message: 'Thời gian chiếu bị trùng' });
        }

        // Create seats
        const room = await Room.findById(roomId);
        const seats = [];
        for (let i = 0; i < room.rows; i++) {
            for (let j = 0; j < room.columns; j++) {
                seats.push({
                    seatCode: `${String.fromCharCode(65 + i)}${j + 1}`,
                    status: 'available'
                });
            }
        }

        const showtime = new Showtime({
            movieId,
            roomId,
            cinemaId,
            startTime,
            endTime,
            price,
            seats,
            status: 'scheduled'
        });

        const newShowtime = await showtime.save();
        res.status(201).json(newShowtime);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update showtime
router.patch('/showtimes/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id);
        if (!showtime) return res.status(404).json({ message: 'Lịch chiếu không tìm thấy' });

        if (req.body.price) showtime.price = req.body.price;
        if (req.body.status) showtime.status = req.body.status;

        const updatedShowtime = await showtime.save();
        res.json(updatedShowtime);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// === TICKET & ORDER MANAGEMENT ===

// Get all orders
router.get('/orders', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId')
            .populate('showtimeId')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order details
router.get('/orders/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId')
            .populate('showtimeId')
            .populate('tickets.ticketId')
            .populate('combos.comboId');
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tìm thấy' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel order
router.patch('/orders/:id/cancel', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tìm thấy' });

        order.status = 'cancelled';
        await order.save();

        // Release seats
        const showtime = await Showtime.findById(order.showtimeId);
        if (showtime) {
            order.tickets.forEach(ticket => {
                showtime.seats.forEach(seat => {
                    if (seat.seatCode === ticket.seatCode) {
                        seat.status = 'available';
                    }
                });
            });
            await showtime.save();
        }

        res.json({ message: 'Đơn hàng đã được hủy' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// === STATISTICS & REPORTS ===

// Revenue report
router.get('/reports/revenue', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {
            status: 'paid',
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        const orders = await Order.find(query).populate('showtimeId');
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;

        res.json({
            totalRevenue,
            totalOrders,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            orders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Fill rate report
router.get('/reports/fill-rate', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate, cinemaId } = req.query;
        const query = {
            startTime: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (cinemaId) query.cinemaId = cinemaId;

        const showtimes = await Showtime.find(query);
        
        const reportData = showtimes.map(showtime => {
            const totalSeats = showtime.seats.length;
            const bookedSeats = showtime.seats.filter(s => s.status === 'booked').length;
            const fillRate = (bookedSeats / totalSeats) * 100;

            return {
                showtimeId: showtime._id,
                totalSeats,
                bookedSeats,
                availableSeats: totalSeats - bookedSeats,
                fillRate: fillRate.toFixed(2) + '%'
            };
        });

        res.json(reportData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Movie sales report
router.get('/reports/movie-sales', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const orders = await Order.aggregate([
            {
                $match: {
                    status: 'paid',
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $lookup: {
                    from: 'showtimes',
                    localField: 'showtimeId',
                    foreignField: '_id',
                    as: 'showtime'
                }
            },
            {
                $unwind: '$showtime'
            },
            {
                $group: {
                    _id: '$showtime.movieId',
                    totalRevenue: { $sum: '$totalAmount' },
                    totalTickets: { $sum: { $size: '$tickets' } }
                }
            },
            {
                $lookup: {
                    from: 'movies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'movie'
                }
            }
        ]);

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
