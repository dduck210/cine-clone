const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');
const { emitAdminNotification } = require('../services/notification-service');
const { sendPaymentSuccessEmail, sendRefundEmail } = require('../services/email-service');

// Create payment
router.post('/', protect, async (req, res) => {
    const { bookingId, method } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });
        if (booking.status === 'paid')
            return res.status(400).json({ message: 'Booking already paid' });

        const isCash = method === 'cash';

        const payment = new Payment({
            booking: bookingId,
            method,
            amount: booking.totalPrice,
            // Cash stays pending until admin confirms at counter
            status: isCash ? 'pending' : 'success',
        });

        await payment.save();

        booking.paymentId = payment._id;
        if (!isCash) {
            booking.status = 'paid';
            await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'booked' });
        }
        await booking.save();

        if (!isCash) {
            emitAdminNotification('booking_paid', {
                title: 'Thanh toán thành công',
                message: `Đơn ${booking.bookingCode || booking._id} đã được thanh toán`,
                bookingId: booking._id,
                bookingCode: booking.bookingCode,
                amount: booking.totalPrice,
            });
            sendPaymentSuccessEmail(booking).catch(() => {});
        }

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get payment by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('booking');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Refund payment (admin only)
router.post('/:id/refund', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        const booking = await Booking.findById(payment.booking);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (req.user.role !== 'admin' && booking.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });
        if (booking.status === 'cancelled')
            return res.status(400).json({ message: 'Booking already cancelled' });

        payment.status = 'refunded';
        payment.refundAmount = payment.amount;
        payment.refundDate = new Date();
        await payment.save();

        booking.status = 'refunded';
        await booking.save();
        sendRefundEmail(booking).catch(() => {});

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
