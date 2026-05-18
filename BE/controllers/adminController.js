const Cinema = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Showtime = require('../models/Showtime');

// ===== CINEMA MANAGEMENT =====

// Get all cinemas
const getAllCinemas = async (req, res) => {
    try {
        const cinemas = await Cinema.find();
        res.json(cinemas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create cinema
const createCinema = async (req, res) => {
    const { name, location, address, phone, email, city } = req.body;
    try {
        const cinema = new Cinema({
            name,
            location,
            address,
            phone,
            email,
            city,
        });
        await cinema.save();
        res.status(201).json(cinema);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===== ROOM MANAGEMENT =====

// Get rooms by cinema
const getRoomsByCinema = async (req, res) => {
    try {
        const rooms = await CinemaRoom.find({ cinema: req.params.cinemaId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create room
const createRoom = async (req, res) => {
    const { cinemaId, name, rows, cols, roomType } = req.body;
    try {
        const totalSeats = rows * cols;
        const room = new CinemaRoom({
            cinema: cinemaId,
            name,
            rows,
            cols,
            totalSeats,
            roomType,
        });

        await room.save();

        // Update cinema total rooms count
        await Cinema.findByIdAndUpdate(cinemaId, { $inc: { totalRooms: 1 } });

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===== STATISTICS & REPORTS =====

// Get revenue report
const getRevenueReport = async (req, res) => {
    try {
        const { startDate, endDate, movieId } = req.query;

        const filter = { status: 'success' };

        if (startDate && endDate) {
            filter.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const payments = await Payment.find(filter).populate({
            path: 'booking',
            populate: { path: 'showtime', populate: { path: 'movie' } },
        });

        let report = {
            totalRevenue: 0,
            totalBookings: 0,
            data: [],
        };

        if (movieId) {
            // Revenue by specific movie
            report.data = payments
                .filter(p => p.booking.showtime.movie._id.toString() === movieId)
                .map(p => ({
                    bookingCode: p.booking.bookingCode,
                    amount: p.amount,
                    date: p.paymentDate,
                }));
        } else {
            // Revenue by movie (aggregate)
            const movieRevenue = {};
            payments.forEach(p => {
                const movie = p.booking.showtime.movie;
                if (!movieRevenue[movie._id]) {
                    movieRevenue[movie._id] = {
                        movieId: movie._id,
                        movieTitle: movie.title,
                        revenue: 0,
                        bookings: 0,
                    };
                }
                movieRevenue[movie._id].revenue += p.amount;
                movieRevenue[movie._id].bookings += 1;
            });
            report.data = Object.values(movieRevenue);
        }

        report.totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        report.totalBookings = payments.length;

        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get occupancy rate
const getOccupancyRate = async (req, res) => {
    try {
        const { showtimeId, cinemaId, startDate, endDate } = req.query;

        let filter = {};
        if (showtimeId) {
            filter._id = showtimeId;
        } else if (cinemaId) {
            filter.cinema = cinemaId;
        }

        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const showtimes = await Showtime.find(filter);

        let totalSeats = 0;
        let bookedSeats = 0;

        for (const showtime of showtimes) {
            const bookedCount = await Booking.countDocuments({
                showtime: showtime._id,
                status: 'paid',
            });
            totalSeats += showtime.totalSeats;
            bookedSeats += bookedCount;
        }

        const occupancyRate = totalSeats > 0 ? ((bookedSeats / totalSeats) * 100).toFixed(2) : 0;

        res.json({
            totalSeats,
            bookedSeats,
            occupancyRate: parseFloat(occupancyRate),
            showtimeCount: showtimes.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get top movies
const getTopMovies = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;

        let matchFilter = { 'payment.status': 'success' };

        if (startDate && endDate) {
            matchFilter['payment.paymentDate'] = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const topMovies = await Payment.aggregate([
            { $match: matchFilter },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'booking',
                    foreignField: '_id',
                    as: 'booking',
                },
            },
            { $unwind: '$booking' },
            {
                $lookup: {
                    from: 'showtimes',
                    localField: 'booking.showtime',
                    foreignField: '_id',
                    as: 'showtime',
                },
            },
            { $unwind: '$showtime' },
            {
                $lookup: {
                    from: 'movies',
                    localField: 'showtime.movie',
                    foreignField: '_id',
                    as: 'movie',
                },
            },
            { $unwind: '$movie' },
            {
                $group: {
                    _id: '$movie._id',
                    title: { $first: '$movie.title' },
                    totalBookings: { $sum: 1 },
                    totalRevenue: { $sum: '$amount' },
                },
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: parseInt(limit) },
        ]);

        res.json(topMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get booking statistics
const getBookingStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let filter = {};
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const totalBookings = await Booking.countDocuments(filter);
        const paidBookings = await Booking.countDocuments({ ...filter, status: 'paid' });
        const pendingBookings = await Booking.countDocuments({ ...filter, status: 'pending' });
        const cancelledBookings = await Booking.countDocuments({ ...filter, status: 'cancelled' });

        const totalRevenue = await Payment.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        res.json({
            totalBookings,
            paidBookings,
            pendingBookings,
            cancelledBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllCinemas,
    createCinema,
    getRoomsByCinema,
    createRoom,
    getRevenueReport,
    getOccupancyRate,
    getTopMovies,
    getBookingStats,
};