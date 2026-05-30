const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Seat = require('../../models/Seat');
const { protect } = require('../../middleware/auth');
const { sendPaymentSuccessEmail, sendAdminPaymentNotificationEmail } = require('../../services/email-service');
const notificationService = require('../../services/notification-service');

const CASSO_API_KEY = process.env.CASSO_API_KEY || '';
const CASSO_API_URL = 'https://oauth.casso.vn/v2/transactions';

// GET /api/payments/casso/status/:bookingId
// FE polls this every 3s — BE calls Casso API to check for matching transaction
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
                showDate: booking.showtime?.date ? new Date(booking.showtime.date).toLocaleDateString('vi-VN') : '',
                selectedSeats: booking.seatNumbers || [],
                finalTotalPrice: booking.totalPrice,
                poster: booking.showtime?.movie?.poster || '',
                combos: booking.extraItems || [],
            });
        }

        if (CASSO_API_KEY) {
            const found = await findMatchingTransaction(booking);
            if (found) {
                await processSuccessfulPayment(booking._id, found.tid, found.amount);
                return res.json({ paid: true });
            }
        }

        res.json({ paid: false });
    } catch (error) {
        console.error('[casso] Status check error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// POST /api/payments/casso/webhook — optional, dùng khi cấu hình webhook trong Casso
router.post('/webhook', async (req, res) => {
    try {
        const { error, data } = req.body;
        if (error !== 0 || !data) return res.json({ error: 0 });

        const transactions = Array.isArray(data) ? data : [data];

        for (const tx of transactions) {
            const description = tx.description || '';
            const amount = tx.amount || 0;
            if (amount <= 0) continue;

            const codes = extractBookingCodes(description);
            if (!codes.length) continue;

            const booking = await Booking.findOne({ bookingCode: { $in: codes }, status: 'pending' });
            if (!booking) continue;

            if (Math.abs(amount - booking.totalPrice) > 1000) continue;

            const txId = tx.reference || tx.tid || `CASSO_${tx.id || Date.now()}`;
            await processSuccessfulPayment(booking._id, txId, amount);
        }
    } catch (e) {
        console.error('[casso] Webhook error:', e);
    }

    res.json({ error: 0 });
});

async function findMatchingTransaction(booking) {
    const fromDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const response = await axios.get(CASSO_API_URL, {
        headers: { Authorization: `Apikey ${CASSO_API_KEY}` },
        params: { fromDate, pageSize: 50, sort: 'DESC' },
        timeout: 5000,
    });

    if (response.data?.error !== 0) return null;

    const records = response.data?.data?.records || [];
    const bookingCode = booking.bookingCode.toUpperCase();

    return records.find((tx) => {
        if (tx.amount <= 0) return false;
        const desc = (tx.description || '').toUpperCase();
        if (!desc.includes(bookingCode)) return false;
        if (Math.abs(tx.amount - booking.totalPrice) > 1000) return false;
        return true;
    }) || null;
}

function extractBookingCodes(content = '') {
    const upper = content.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ');
    return upper.match(/BK[0-9A-Z]{8,}/g) || [];
}

async function processSuccessfulPayment(bookingId, transactionId, amount) {
    const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        { $set: { status: 'paid' } },
        { returnDocument: 'after' }
    );
    if (!booking) return;

    const payment = new Payment({ booking: bookingId, method: 'qr', amount, transactionId, status: 'success', paymentDate: new Date() });
    await payment.save();
    booking.paymentId = payment._id;
    await booking.save();

    await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'booked' });

    const ctx = await Booking.findById(bookingId)
        .populate('user', 'name email phone')
        .populate({ path: 'showtime', populate: [{ path: 'movie', select: 'title poster' }, { path: 'cinema', select: 'name address' }, { path: 'room', select: 'name' }] })
        .populate('paymentId', 'method status');

    await sendPaymentSuccessEmail(ctx, 'qr').catch(() => {});
    sendAdminPaymentNotificationEmail(ctx, 'qr').catch(() => {});
    notificationService.createNotification({
        type: 'payment_paid',
        title: 'Thanh toán MB Bank thành công',
        message: `${ctx?.user?.name || 'Khách hàng'} vừa thanh toán đơn ${ctx?.bookingCode}`,
        data: { bookingId: ctx?._id?.toString(), bookingCode: ctx?.bookingCode },
    });
}

module.exports = router;
