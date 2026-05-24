const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');
const { sendPaymentSuccessEmail, sendAdminPaymentNotificationEmail } = require('../services/email-service');
const notificationService = require('../services/notification-service');

const PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_API = process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

const hmac = (data) => crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');

// POST /api/payments/momo/create — Tạo QR thanh toán MoMo (captureWallet)
router.post('/create', protect, async (req, res) => {
    const { bookingId } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'pending') return res.status(400).json({ message: 'Booking is not pending' });

        const requestId = PARTNER_CODE + Date.now();
        const orderId = requestId;
        const amount = booking.totalPrice.toString();
        const orderInfo = 'Thanh toan ve phim 5Cine';
        const redirectUrl = `${CLIENT_URL}/payment-success`;
        const ipnUrl = `${SERVER_URL}/api/payments/momo/ipn`;
        const requestType = 'captureWallet';
        const extraData = Buffer.from(JSON.stringify({ bookingId: bookingId.toString() })).toString('base64');

        const rawSignature = `accessKey=${ACCESS_KEY}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
        const signature = hmac(rawSignature);

        const response = await fetch(MOMO_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                partnerCode: PARTNER_CODE,
                accessKey: ACCESS_KEY,
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                extraData,
                requestType,
                signature,
                lang: 'vi',
                autoCapture: true,
            }),
        });

        const data = await response.json();
        if (data.resultCode !== 0) {
            return res.status(400).json({ message: data.message || 'Tạo thanh toán MoMo thất bại' });
        }

        // Extend booking hold to 15 min so it doesn't expire while user is on MoMo page
        booking.momoOrderId = orderId;
        booking.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await booking.save();

        res.json({
            payUrl: data.payUrl,
            qrCodeUrl: data.qrCodeUrl || null,
            orderId,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/payments/momo/ipn — MoMo gọi khi user thanh toán thành công
router.post('/ipn', async (req, res) => {
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType,
        transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;

    const rawSignature = `accessKey=${ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    if (signature !== hmac(rawSignature)) {
        return res.status(400).json({ message: 'Invalid signature' });
    }

    if (resultCode === 0) {
        try {
            const { bookingId } = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
            const booking = await Booking.findById(bookingId);
            if (!booking) return res.status(200).json({ message: 'ok' });

            // Save transId and process payment immediately
            booking.momoTransId = transId.toString();
            await booking.save();

            if (booking.status === 'pending') {
                await processSuccessfulPayment(bookingId, transId.toString(), booking.totalPrice);
            }
        } catch (e) {
            console.error('[momo] IPN processing error:', e);
        }
    }

    res.status(200).json({ message: 'ok' });
});

// GET /api/payments/momo/status/:bookingId — Frontend poll payment status
router.get('/status/:bookingId', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] })
            .populate('paymentId', 'method status');
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
                ticketStatus: booking.ticketStatus,
            });
        }

        res.json({ paid: false });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/payments/momo/confirm — Fallback khi user bị redirect về từ MoMo app
router.post('/confirm', protect, async (req, res) => {
    const { partnerCode, orderId, requestId, amount, orderInfo, orderType,
        transId, resultCode, message, payType, responseTime, extraData, signature } = req.body;

    const rawSignature = `accessKey=${ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    if (signature !== hmac(rawSignature)) {
        return res.status(400).json({ message: 'Chữ ký không hợp lệ' });
    }

    if (parseInt(resultCode) !== 0) {
        return res.status(400).json({ message: message || 'Thanh toán thất bại' });
    }

    try {
        const { bookingId } = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
        const booking = await Booking.findById(bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] })
            .populate('user', 'name email');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        booking.momoTransId = transId.toString();
        await booking.save();

        if (booking.status === 'pending') {
            await processSuccessfulPayment(bookingId, transId.toString(), booking.totalPrice);
        }

        const updated = await Booking.findById(bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] });

        res.json({
            paid: true,
            bookingId: updated._id,
            bookingCode: updated.bookingCode,
            movieTitle: updated.showtime?.movie?.title || '',
            cinemaName: updated.showtime?.cinema?.name || '',
            roomName: updated.showtime?.room?.name || '',
            showTime: updated.showtime?.startTime || '',
            showDate: updated.showtime?.date
                ? new Date(updated.showtime.date).toLocaleDateString('vi-VN') : '',
            selectedSeats: updated.seatNumbers || [],
            finalTotalPrice: updated.totalPrice,
            poster: updated.showtime?.movie?.poster || '',
            combos: updated.extraItems || [],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function processSuccessfulPayment(bookingId, transactionId, amount) {
    const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },
        { $set: { status: 'paid' } },
        { returnDocument: 'after' }
    );
    if (!booking) return;

    const payment = new Payment({
        booking: bookingId,
        method: 'momo',
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

    await sendPaymentSuccessEmail(bookingContext, 'momo');
    sendAdminPaymentNotificationEmail(bookingContext, 'momo').catch(() => { });
    notificationService.createNotification({
        type: 'payment_paid',
        title: 'Thanh toán MoMo thành công',
        message: `${bookingContext?.user?.name || 'Khách hàng'} vừa thanh toán đơn ${bookingContext?.bookingCode}`,
        data: { bookingId: bookingContext?._id?.toString(), bookingCode: bookingContext?.bookingCode },
    });
}

// POST /api/payments/momo/confirm-demo/:bookingId — Simulate MoMo success for localhost demo
router.post('/confirm-demo/:bookingId', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Not authorized' });
        if (booking.status === 'paid')
            return res.json({ paid: true, bookingCode: booking.bookingCode });
        if (booking.status !== 'pending')
            return res.status(400).json({ message: 'Booking is not pending' });

        const transactionId = `DEMO_MOMO_${Date.now()}`;
        await processSuccessfulPayment(booking._id, transactionId, booking.totalPrice);

        const updated = await Booking.findById(booking._id);
        res.json({ paid: true, bookingCode: updated.bookingCode });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
