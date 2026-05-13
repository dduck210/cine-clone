const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');

// Create payment
router.post('/', protect, async (req, res) => {
    const { bookingId, method } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking không tồn tại' });

        const payment = new Payment({
            booking: bookingId,
            method,
            amount: booking.totalPrice,
            status: 'success'
        });

        await payment.save();

        booking.status = 'paid';
        booking.paymentId = payment._id;
        await booking.save();

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
router.get('/:id', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('booking');
        if (!payment) return res.status(404).json({ message: 'Payment không tồn tại' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Refund payment
router.post('/:id/refund', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment không tồn tại' });

        const booking = await Booking.findById(payment.booking);
        if (!booking) return res.status(404).json({ message: 'Booking không tồn tại' });

        payment.status = 'cancelled';
        payment.refundAmount = payment.amount;
        payment.refundDate = new Date();
        await payment.save();

        booking.status = 'cancelled';
        await booking.save();

        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: 'available' }
        );

        res.json({ message: 'Hoàn tiền thành công', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
