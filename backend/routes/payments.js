const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');

// Create payment
router.post('', protect, async (req, res) => {
    const { bookingId, method } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const payment = new Payment({
            booking: bookingId,
            method,
            amount: booking.totalPrice,
            status: 'success'
        });

        await payment.save();

        // Update booking to paid
        booking.status = 'paid';
        await booking.save();

        // Mark seats as booked
        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: 'booked' }
        );

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get payment by ID
router.get(':id', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('booking');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Refund payment
router.post(':id/refund', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        const booking = await Booking.findById(payment.booking);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        payment.status = 'cancelled';
        payment.refundAmount = payment.amount;
        payment.refundDate = new Date();
        await payment.save();

        booking.status = 'cancelled';
        await booking.save();

        // Release seats back to available
        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: 'available' }
        );

        res.json({ message: 'Payment refunded', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;