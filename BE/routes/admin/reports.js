const express = require('express');
const router = express.Router();
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Showtime = require('../../models/Showtime');
const { protect, admin } = require('../../middleware/auth');

// GET /api/admin/reports/revenue
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

// GET /api/admin/reports/top-movies
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

// GET /api/admin/reports/bookings
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

// GET /api/admin/reports/refunds
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

// GET /api/admin/reports/combo-revenue
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
                },
            },
            { $sort: { totalRevenue: -1 } },
        ]);

        res.json({ items: result, totalComboRevenue: result.reduce((sum, item) => sum + item.totalRevenue, 0) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/reports/timeslots
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
