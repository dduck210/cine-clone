const express = require('express');
const router = express.Router();
const Cinema = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const { protect, admin } = require('../middleware/auth');

// ─── Cinema & Room Management ───────────────────────────────────────────────

router.get('/cinemas', async (req, res) => {
    try {
        const cinemas = await Cinema.find({});
        res.json(cinemas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/cinemas', protect, admin, async (req, res) => {
    try {
        const cinema = new Cinema(req.body);
        await cinema.save();
        res.status(201).json(cinema);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/cinemas/:id', protect, admin, async (req, res) => {
    try {
        const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cinema) return res.status(404).json({ message: 'Cinema not found' });
        res.json(cinema);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Preview: how many upcoming showtimes + bookings would be affected
router.get('/emergency-close/:id/preview', protect, admin, async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        console.log(`[Emergency Close] cinemaId=${req.params.id} today=${today.toISOString()}`);
        const showtimes = await Showtime.find({
            cinema: req.params.id,
            status: 'active',
            date: { $gte: today },
        }).populate('movie', 'title').populate('room', 'name').sort({ date: 1, startTime: 1 });
        console.log(`[Emergency Close] found ${showtimes.length} showtimes`);

        const preview = await Promise.all(showtimes.map(async (st) => {
            const bookings = await Booking.find({ showtime: st._id, status: { $in: ['pending', 'paid'] } });
            return {
                _id: st._id,
                movieTitle: st.movie?.title || '—',
                roomName: st.room?.name || '—',
                date: st.date,
                startTime: st.startTime,
                totalBookings: bookings.length,
                paidBookings: bookings.filter(b => b.status === 'paid').length,
            };
        }));

        res.json({
            totalShowtimes: preview.length,
            totalBookings: preview.reduce((s, p) => s + p.totalBookings, 0),
            totalRefunds: preview.reduce((s, p) => s + p.paidBookings, 0),
            showtimes: preview,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Execute: cancel all upcoming showtimes + bulk refund for a cinema
router.post('/emergency-close/:id', protect, admin, async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const showtimes = await Showtime.find({
            cinema: req.params.id,
            status: 'active',
            date: { $gte: today },
        });

        let cancelledShowtimes = 0, cancelledBookings = 0, refundedBookings = 0;

        for (const st of showtimes) {
            st.status = 'cancelled';
            await st.save();
            cancelledShowtimes++;

            const bookings = await Booking.find({ showtime: st._id, status: { $in: ['pending', 'paid'] } });
            const bookingIds = bookings.map(b => b._id);
            const seatIds = bookings.flatMap(b => b.seats);

            await Seat.updateMany({ _id: { $in: seatIds } }, { status: 'available', bookedBy: null });
            await Booking.updateMany({ _id: { $in: bookingIds } }, { status: 'cancelled' });
            cancelledBookings += bookings.length;

            const paidIds = bookings.filter(b => b.status === 'paid').map(b => b._id);
            if (paidIds.length > 0) {
                await Payment.updateMany(
                    { booking: { $in: paidIds }, status: 'success' },
                    { $set: { status: 'refunded', refundDate: new Date() } }
                );
                await Booking.updateMany({ _id: { $in: paidIds } }, { status: 'refunded' });
                refundedBookings += paidIds.length;
            }
        }

        res.json({ message: 'Cinema emergency closed', cancelledShowtimes, cancelledBookings, refundedBookings });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/rooms/:id/showtimes', protect, admin, async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const showtimes = await Showtime.find({
            room: req.params.id,
            date: { $gte: today },
            status: 'active',
        }).populate('movie', 'title').sort({ date: 1, startTime: 1 });
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/cinemas/:cinemaId/rooms', async (req, res) => {
    try {
        const rooms = await CinemaRoom.find({ cinema: req.params.cinemaId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/rooms', protect, admin, async (req, res) => {
    try {
        const room = new CinemaRoom(req.body);
        await room.save();
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update room seat matrix (admin configures seat types per room)
router.put('/rooms/:id', protect, admin, async (req, res) => {
    try {
        const room = await CinemaRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const { name, rows, cols, roomType, status, seatMatrix } = req.body;
        if (name) room.name = name;
        if (rows) room.rows = rows;
        if (cols) room.cols = cols;
        if (roomType) room.roomType = roomType;
        if (status) room.status = status;
        if (seatMatrix !== undefined) {
            // Recalculate totalSeats from matrix (exclude aisles)
            let count = 0;
            for (const row of seatMatrix) {
                for (const cell of row) {
                    if (cell && cell.type !== 'aisle') count++;
                }
            }
            room.seatMatrix = seatMatrix;
            room.totalSeats = count || room.rows * room.cols;
        }

        await room.save();
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark ticket as printed (admin scans/issues physical ticket)
router.put('/bookings/:id/print', protect, admin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Only paid bookings can be printed' });
        booking.ticketStatus = 'printed';
        await booking.save();
        res.json({ message: 'Ticket marked as printed', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lock/unlock individual seat (maintenance)
router.put('/seats/:id/lock', protect, admin, async (req, res) => {
    try {
        const { isLocked } = req.body;
        const seat = await Seat.findByIdAndUpdate(
            req.params.id,
            { isLocked: !!isLocked },
            { new: true }
        );
        if (!seat) return res.status(404).json({ message: 'Seat not found' });
        res.json(seat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Booking Management ─────────────────────────────────────────────────────

router.get('/bookings', protect, admin, async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] })
            .populate('user', 'name email phone')
            .populate('paymentId', 'method status')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Confirm cash payment (admin)
router.put('/bookings/:id/confirm', protect, admin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status === 'paid') return res.status(400).json({ message: 'Already paid' });

        booking.status = 'paid';
        await booking.save();

        if (booking.paymentId) {
            await Payment.findByIdAndUpdate(booking.paymentId, { status: 'success', paymentDate: new Date() });
        }
        await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'booked' });

        res.json({ message: 'Payment confirmed', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── User Management ────────────────────────────────────────────────────────

router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { name, role } = req.body;
        if (name) user.name = name;
        if (role) user.role = role;
        await user.save();
        res.json(await User.findById(user._id).select('-password'));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ message: 'Không thể xóa tài khoản admin' });
        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Showtime Management ────────────────────────────────────────────────────

router.get('/showtimes', protect, admin, async (req, res) => {
    try {
        const showtimes = await Showtime.find({})
            .populate('movie', 'title poster duration')
            .populate('cinema', 'name')
            .populate('room', 'name')
            .sort({ date: -1, startTime: -1 });
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Reports & Statistics ───────────────────────────────────────────────────

// Revenue by period: day/month/quarter/year
router.get('/reports/revenue', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const match = { status: { $in: ['paid', 'refunded'] } };
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const groupFormats = {
            day: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
            month: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            quarter: { year: { $year: '$createdAt' }, quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } } },
            year: { year: { $year: '$createdAt' } },
        };

        const [revenue, extras] = await Promise.all([
            Booking.aggregate([
                { $match: match },
                { $group: { _id: groupFormats[groupBy] || groupFormats.day, totalRevenue: { $sum: '$totalPrice' }, totalBookings: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            ]),
            Booking.aggregate([
                { $match: match },
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalBookings: { $sum: 1 } } },
            ]),
        ]);

        res.json({ byPeriod: revenue, summary: extras[0] || { totalRevenue: 0, totalBookings: 0 } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Occupancy rate
router.get('/reports/occupancy', protect, admin, async (req, res) => {
    try {
        const showtimes = await Showtime.find({ status: 'active' }).populate('movie', 'title');
        const occupancy = showtimes.map(st => ({
            showtimeId: st._id,
            movie: st.movie?.title,
            date: st.date,
            startTime: st.startTime,
            occupied: st.totalSeats - st.availableSeats,
            total: st.totalSeats,
            percentage: st.totalSeats > 0
                ? ((st.totalSeats - st.availableSeats) / st.totalSeats * 100).toFixed(1)
                : '0.0',
        }));
        res.json(occupancy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Top movies by revenue & bookings
router.get('/reports/top-movies', protect, admin, async (req, res) => {
    try {
        const topMovies = await Booking.aggregate([
            { $match: { status: 'paid' } },
            { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtime' } },
            { $unwind: '$showtime' },
            { $lookup: { from: 'movies', localField: 'showtime.movie', foreignField: '_id', as: 'movie' } },
            { $unwind: '$movie' },
            { $group: { _id: '$movie._id', title: { $first: '$movie.title' }, poster: { $first: '$movie.poster' }, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
        ]);
        res.json(topMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Booking stats by status
router.get('/reports/bookings', protect, admin, async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalPrice' } } },
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Refund stats
router.get('/reports/refunds', protect, admin, async (req, res) => {
    try {
        const refunds = await Payment.aggregate([
            { $match: { status: 'refunded' } },
            { $group: { _id: null, totalRefunds: { $sum: 1 }, totalRefundAmount: { $sum: '$refundAmount' } } },
        ]);
        res.json(refunds[0] || { totalRefunds: 0, totalRefundAmount: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// F&B / Combo revenue (doanh thu phụ riêng biệt)
router.get('/reports/combo-revenue', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const match = { status: 'paid', 'extraItems.0': { $exists: true } };
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const result = await Booking.aggregate([
            { $match: match },
            { $unwind: '$extraItems' },
            {
                $group: {
                    _id: '$extraItems.name',
                    totalQuantity: { $sum: '$extraItems.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$extraItems.price', '$extraItems.quantity'] } },
                }
            },
            { $sort: { totalRevenue: -1 } },
        ]);

        const totalComboRevenue = result.reduce((s, r) => s + r.totalRevenue, 0);
        res.json({ items: result, totalComboRevenue });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Phim theo suất (số suất chiếu + số booking mỗi phim theo ngày)
router.get('/reports/movies-showtime', protect, admin, async (req, res) => {
    try {
        const { date } = req.query;
        const showtimeFilter = { status: 'active' };
        if (date) {
            const d = new Date(date);
            showtimeFilter.date = {
                $gte: new Date(d.setHours(0, 0, 0, 0)),
                $lt: new Date(d.setHours(23, 59, 59, 999)),
            };
        }

        const data = await Showtime.aggregate([
            { $match: showtimeFilter },
            {
                $group: {
                    _id: '$movie',
                    showtimeCount: { $sum: 1 },
                    totalSeats: { $sum: '$totalSeats' },
                    bookedSeats: { $sum: { $subtract: ['$totalSeats', '$availableSeats'] } },
                }
            },
            { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
            { $unwind: '$movie' },
            { $project: { title: '$movie.title', poster: '$movie.poster', showtimeCount: 1, totalSeats: 1, bookedSeats: 1 } },
            { $sort: { showtimeCount: -1 } },
        ]);

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Hot time slots
router.get('/reports/timeslots', protect, admin, async (req, res) => {
    try {
        const data = await Booking.aggregate([
            { $match: { status: 'paid' } },
            { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtime' } },
            { $unwind: '$showtime' },
            { $group: { _id: '$showtime.timeSlot', bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
            { $sort: { bookings: -1 } },
        ]);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
