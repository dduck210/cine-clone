const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');
const { sendPaymentSuccessEmail, sendRefundEmail } = require('../services/email-service');
const notificationService = require('../services/notification-service');

async function getBookingContext(bookingId) {
    return Booking.findById(bookingId)
        .populate('user', 'name email phone')
        .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title poster' },
                { path: 'cinema', select: 'name address' },
                { path: 'room', select: 'name' },
            ],
        })
        .populate('paymentId', 'method status');
}

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
            const bookingContext = await getBookingContext(booking._id);
            await sendPaymentSuccessEmail(bookingContext, method);
            notificationService.createNotification({
                type: 'payment_paid',
                title: 'Thanh toán thành công',
                message: `${bookingContext?.user?.name || 'Khách hàng'} vừa thanh toán đơn ${bookingContext?.bookingCode}`,
                data: {
                    bookingId: bookingContext?._id?.toString(),
                    bookingCode: bookingContext?.bookingCode,
                },
            });
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

        // Release seats back to available
        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: 'available' }
        );

        const bookingContext = await getBookingContext(booking._id);
        await sendRefundEmail(bookingContext, 'Yêu cầu hoàn tiền đã được xác nhận');
        notificationService.createNotification({
            type: 'refund',
            title: 'Đơn đã hoàn tiền',
            message: `Đơn ${bookingContext?.bookingCode} đã được hoàn tiền`,
            data: {
                bookingId: bookingContext?._id?.toString(),
                bookingCode: bookingContext?.bookingCode,
            },
        });

        res.json({ message: 'Payment refunded', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
