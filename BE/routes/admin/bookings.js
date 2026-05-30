const express = require('express');
const router = express.Router();
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Seat = require('../../models/Seat');
const { protect, admin } = require('../../middleware/auth');
const { auditLog } = require('../../utils/audit-logger');
const { sendPaymentSuccessEmail } = require('../../services/email-service');
const notificationService = require('../../services/notification-service');
const ticketEvents = require('../../services/ticket-event-emitter');
const { loadBookingContext } = require('../../controllers/admin/admin-helpers');

// GET /api/admin/bookings
router.get('/bookings', protect, admin, async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie' },
                    { path: 'cinema' },
                    { path: 'room', select: 'name' },
                ],
            })
            .populate('user', 'name email phone')
            .populate('paymentId', 'method status')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/admin/bookings/:id/confirm — xác nhận thanh toán tiền mặt
router.put('/bookings/:id/confirm', protect, admin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status === 'paid') return res.status(400).json({ message: 'Already paid' });

        booking.status = 'paid';
        await booking.save();

        if (booking.paymentId) {
            await Payment.findByIdAndUpdate(booking.paymentId, {
                status: 'success',
                paymentDate: new Date(),
            });
        }
        await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'booked' });

        const bookingContext = await loadBookingContext(booking._id);
        await sendPaymentSuccessEmail(bookingContext, 'cash');
        notificationService.createNotification({
            type: 'payment_paid',
            title: 'Thanh toán tại quầy thành công',
            message: `${bookingContext?.user?.name || 'Khách hàng'} đã thanh toán đơn ${bookingContext?.bookingCode}`,
            data: {
                bookingId: bookingContext?._id?.toString(),
                bookingCode: bookingContext?.bookingCode,
            },
        });

        auditLog(req, 'CONFIRM_PAYMENT', 'Booking', booking._id, `Confirmed cash payment for booking ${booking.bookingCode}`);
        res.json({ message: 'Payment confirmed', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/admin/bookings/:id/print — đánh dấu vé đã in
router.put('/bookings/:id/print', protect, admin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Only paid bookings can be printed' });

        booking.ticketStatus = 'printed';
        await booking.save();
        auditLog(req, 'PRINT_TICKET', 'Booking', booking._id, `Printed ticket for booking ${booking.bookingCode}`);

        ticketEvents.emit(booking._id, 'ticket_printed', {
            bookingId: booking._id.toString(),
            bookingCode: booking.bookingCode,
            ticketStatus: 'printed',
            status: booking.status,
        });

        notificationService.createNotification({
            type: 'ticket_printed',
            title: 'Vé đã được xác nhận',
            message: `Đơn ${booking.bookingCode} đã được đánh dấu in vé`,
            data: { bookingId: booking._id.toString(), bookingCode: booking.bookingCode },
        });

        res.json({ message: 'Ticket marked as printed', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
