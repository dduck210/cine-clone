const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');
const { sendPaymentSuccessEmail, sendAdminPaymentNotificationEmail, sendRefundEmail, sendOtpEmail } = require('../services/email-service');
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

// Send OTP for QR payment confirmation
router.post('/qr/request-otp', protect, async (req, res) => {
    const { bookingId } = req.body;
    try {
        const booking = await Booking.findById(bookingId)
            .populate('user', 'name email')
            .populate({ path: 'showtime', populate: [{ path: 'movie', select: 'title' }] });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.user._id.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });
        if (booking.status === 'paid')
            return res.status(400).json({ message: 'Booking already paid' });

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        booking.otpCode = otp;
        booking.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await booking.save();

        // Internal/fake domains can't receive mail — fall back to the configured system email
        const recipientEmail = booking.user.email.endsWith('@cinema.com')
            ? process.env.EMAIL_USER
            : booking.user.email;
        const displayEmail = recipientEmail || booking.user.email;

        const emailResult = await sendOtpEmail({ ...booking.toObject(), user: { ...booking.user.toObject(), email: recipientEmail } }, otp);
        if (emailResult?.skipped) {
            return res.status(503).json({ message: 'Hệ thống email chưa được cấu hình. Vui lòng liên hệ quản trị viên hoặc dùng phương thức thanh toán khác.' });
        }
        res.json({ message: 'OTP sent', email: displayEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create payment
router.post('/', protect, async (req, res) => {
    const { bookingId, method, otp } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });
        if (booking.status === 'paid')
            return res.status(400).json({ message: 'Booking already paid' });

        // Validate OTP for QR payments
        if (method === 'qr') {
            if (!otp) return res.status(400).json({ message: 'Vui lòng nhập mã OTP' });
            if (!booking.otpCode || !booking.otpExpiry)
                return res.status(400).json({ message: 'Chưa yêu cầu mã OTP, vui lòng thử lại' });
            if (new Date() > booking.otpExpiry)
                return res.status(400).json({ message: 'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới' });
            if (otp !== booking.otpCode)
                return res.status(400).json({ message: 'Mã OTP không đúng' });
            // Clear OTP after successful use
            booking.otpCode = undefined;
            booking.otpExpiry = undefined;
        }

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
            sendAdminPaymentNotificationEmail(bookingContext, method).catch(() => {});
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
