const express = require('express');
const router = express.Router();
const Showtime = require('../../models/Showtime');
const Seat = require('../../models/Seat');
const { protect, admin } = require('../../middleware/auth');
const { expireShowtimes } = require('../../jobs/expire-showtimes');
const { isShowtimeExpired } = require('../../utils/showtime-status');

// GET /api/admin/showtimes
router.get('/showtimes', protect, admin, async (req, res) => {
    try {
        await expireShowtimes();
        const showtimes = await Showtime.find({})
            .populate('movie', 'title poster duration')
            .populate('cinema', 'name')
            .populate('room', 'name')
            .sort({ date: -1, startTime: -1 });

        await Promise.all(showtimes.map(async (showtime) => {
            if (showtime.status === 'active' && isShowtimeExpired(showtime)) {
                showtime.status = 'expired';
                await showtime.save();
            }
        }));

        // Compute actual availableSeats from Seat collection
        const showtimeIds = showtimes.map(s => s._id);
        const seatCounts = await Seat.aggregate([
            { $match: { showtime: { $in: showtimeIds } } },
            {
                $group: {
                    _id: '$showtime',
                    available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
                    total: { $sum: 1 },
                },
            },
        ]);
        const seatMap = Object.fromEntries(seatCounts.map(s => [s._id.toString(), s]));

        const result = showtimes.map(st => {
            const obj = st.toObject();
            const counts = seatMap[st._id.toString()];
            if (counts) {
                obj.availableSeats = counts.available;
                obj.totalSeats = counts.total;
            }
            return obj;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
