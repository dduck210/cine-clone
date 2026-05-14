const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');

// Create booking
router.post('/', protect, async (req, res) => {
    const { showtimeId, seats, extraAmount = 0 } = req.body;
    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

        // Check seat availability
        const availableSeats = await Seat.find({
            showtime: showtimeId,
            status: 'available',
            seatNumber: { $in: seats }
        });

        if (availableSeats.length !== seats.length) {
            return res.status(400).json({ message: 'Some seats are not available' });
        }

        // Calculate total price (seats + combos)
        const totalPrice = showtime.price * seats.length + extraAmount;

        // Create booking
        const booking = new Booking({
            user: req.user._id,
            showtime: showtimeId,
            seats: availableSeats.map(s => s._id),
            seatNumbers: seats,
            totalPrice,
            status: 'pending'
        });

        await booking.save();

        // Mark seats as reserved
        await Seat.updateMany(
            { _id: { $in: availableSeats.map(s => s._id) } },
            { status: 'reserved' }
        );

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's bookings
router.get('/user/all', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] })
            .populate('seats')
            .populate('paymentId', 'method status')
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
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] })
            .populate('seats');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel booking
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status !== 'pending') {
            return res.status(400).json({ message: 'Can only cancel pending bookings' });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Release seats back to available
        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: 'available' }
        );

        res.json({ message: 'Booking cancelled', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
