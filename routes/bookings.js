const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');

// Create booking
router.post('/', protect, async (req, res) => {
    const { showtimeId, seats } = req.body;
    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ message: 'Suất chiếu không tồn tại' });

        const availableSeats = await Seat.find({
            showtime: showtimeId,
            status: 'available',
            seatNumber: { $in: seats }
        });

        if (availableSeats.length !== seats.length) {
            return res.status(400).json({ message: 'Một số ghế đã được đặt, vui lòng chọn ghế khác' });
        }

        const totalPrice = showtime.price * seats.length;

        const booking = new Booking({
            user: req.user._id,
            showtime: showtimeId,
            seats: availableSeats.map(s => s._id),
            seatNumbers: seats,
            totalPrice,
            status: 'pending'
        });

        await booking.save();

        await Seat.updateMany(
            { _id: { $in: availableSeats.map(s => s._id) } },
            { status: 'reserved' }
        );

        await Showtime.findByIdAndUpdate(showtimeId, {
            $inc: { availableSeats: -seats.length }
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's bookings
router.get('/user/all', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
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

// Get booking by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title poster' },
                    { path: 'cinema', select: 'name address' }
                ]
            })
            .populate('seats');
        if (!booking) return res.status(404).json({ message: 'Booking không tồn tại' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel booking
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking không tồn tại' });

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'Chỉ có thể hủy booking đang chờ thanh toán' });
        }

        booking.status = 'cancelled';
        await booking.save();

        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: 'available' }
        );

        await Showtime.findByIdAndUpdate(booking.showtime, {
            $inc: { availableSeats: booking.seatNumbers.length }
        });

        res.json({ message: 'Hủy booking thành công', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
