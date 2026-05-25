const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');
const { sendPaymentSuccessEmail, sendAdminPaymentNotificationEmail } = require('../services/email-service');
const notificationService = require('../services/notification-service');

const SEPAY_API_KEY = process.env.SEPAY_API_KEY || '';

// POST /api/payments/sepay/webhook — SePay gọi khi phát hiện tiền vào tài khoản
// SePay gửi header: Authorization: Apikey <SEPAY_API_KEY>
router.post('/webhook', async (req, res) => {
    // Verify request từ SePay
    const authHeader = req.headers['authorization'] || '';
    const apiKey = authHeader.replace('Apikey ', '').trim();

    if (SEPAY_API_KEY && apiKey !== SEPAY_API_KEY) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { transferAmount, content, transferType } = req.body;

    // Chỉ xử lý giao dịch tiền vào (in)
    if (transferType !== 'in') return res.json({ success: true });

    try {
        // Tìm mã booking trong nội dung chuyển khoản
        // Nội dung chuẩn: "5CINE BOOA1B2C3" hoặc chứa booking code
        const bookingCodeMatch = content?.toUpperCase().match(/[A-Z0-9]{8,}/);
        if (!bookingCodeMatch) return res.json({ success: true });

        // Tìm booking khớp với nội dung chuyển khoản
        const booking = await Booking.findOne({
            bookingCode: { $in: extractBookingCodes(content) },
            status: 'pending',
        });

        if (!booking) return res.json({ success: true });

        // Kiểm tra số tiền khớp
        if (Math.abs(transferAmount - booking.totalPrice) > 1000) {
            console.warn(`[sepay] Amount mismatch: expected ${booking.totalPrice}, got ${transferAmount}`);
            return res.json({ success: true });
        }

        // Xử lý thanh toán thành công
        await processSuccessfulPayment(booking._id, req.body.referenceCode || `SEPAY_${Date.now()}`, transferAmount);
    } catch (e) {
        console.error('[sepay] Webhook error:', e);
    }

    res.json({ success: true });
});

// GET /api/payments/sepay/status/:bookingId — FE poll trạng thái
router.get('/status/:bookingId', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'paid') {
            return res.json({
                paid: true,
                bookingId: booking._id,
                bookingCode: booking.bookingCode,
                movieTitle: booking.showtime?.movie?.title || '',
                cinemaName: booking.showtime?.cinema?.name || '',
                roomName: booking.showtime?.room?.name || '',
                showTime: booking.showtime?.startTime || '',
                showDate: booking.showtime?.date
                    ? new Date(booking.showtime.date).toLocaleDateString('vi-VN') : '',
                selectedSeats: booking.seatNumbers || [],
                finalTotalPrice: booking.totalPrice,
                poster: booking.showtime?.movie?.poster || '',
                combos: booking.extraItems || [],
            });
        }

        res.json({ paid: false });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Trích xuất các booking code có thể có trong nội dung chuyển khoản
function extractBookingCodes(content = '') {
    const upper = content.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ');
    // Booking code thường là 8-12 ký tự chữ+số (ví dụ: BOOA1B2C3)
    return upper.match(/[A-Z]{2,}[0-9A-Z]{4,}/g) || [];
}

async function processSuccessfulPayment(bookingId, transactionId, amount) {
    const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        { $set: { status: 'paid' } },
        { returnDocument: 'after' }
    );
    if (!booking) return;

    const payment = new Payment({
        booking: bookingId,
        method: 'qr',
        amount,
        transactionId,
        status: 'success',
        paymentDate: new Date(),
    });
    await payment.save();

    booking.paymentId = payment._id;
    await booking.save();

    await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'booked' });

    const bookingContext = await Booking.findById(bookingId)
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

    await sendPaymentSuccessEmail(bookingContext, 'qr').catch(() => {});
    sendAdminPaymentNotificationEmail(bookingContext, 'qr').catch(() => {});
    notificationService.createNotification({
        type: 'payment_paid',
        title: 'Thanh toán QR Banking thành công',
        message: `${bookingContext?.user?.name || 'Khách hàng'} vừa thanh toán đơn ${bookingContext?.bookingCode}`,
        data: { bookingId: bookingContext?._id?.toString(), bookingCode: bookingContext?.bookingCode },
    });
}

module.exports = router;
