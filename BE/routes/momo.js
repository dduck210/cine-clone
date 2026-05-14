const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');

const PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const ACCESS_KEY   = process.env.MOMO_ACCESS_KEY   || 'F8BBA842ECF85';
const SECRET_KEY   = process.env.MOMO_SECRET_KEY   || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_API     = process.env.MOMO_API_URL       || 'https://test-payment.momo.vn/v2/gateway/api/create';
const CLIENT_URL   = process.env.CLIENT_URL          || 'http://localhost:5173';
const SERVER_URL   = process.env.SERVER_URL          || 'http://localhost:5000';

const hmac = (data) => crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');

// POST /api/payments/momo/create
router.post('/create', protect, async (req, res) => {
    const { bookingId } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'pending') return res.status(400).json({ message: 'Booking is not pending' });

        const requestId   = PARTNER_CODE + Date.now();
        const orderId     = requestId;
        const amount      = booking.totalPrice.toString();
        const orderInfo   = 'Thanh toan ve phim 5Cine';
        const redirectUrl = `${CLIENT_URL}/payment-success`;
        const ipnUrl      = `${SERVER_URL}/api/payments/momo/ipn`;
        const requestType = 'payWithATM';
        const extraData   = Buffer.from(JSON.stringify({ bookingId: bookingId.toString() })).toString('base64');

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
            }),
        });

        const data = await response.json();
        if (data.resultCode !== 0) {
            return res.status(400).json({ message: data.message || 'Tạo thanh toán MoMo thất bại' });
        }

        res.json({ payUrl: data.payUrl, orderId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/payments/momo/ipn  — MoMo gọi khi có kết quả thanh toán
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
            await processSuccessfulPayment(bookingId, transId.toString(), parseInt(amount));
        } catch (err) {
            console.error('IPN error:', err.message);
        }
    }

    res.status(200).json({ message: 'ok' });
});

// POST /api/payments/momo/confirm — Frontend gọi sau khi MoMo redirect về
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
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] });

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'pending') {
            await processSuccessfulPayment(bookingId, transId.toString(), parseInt(amount));
            await booking.reload?.() || Object.assign(booking, await Booking.findById(bookingId));
        }

        const updatedBooking = await Booking.findById(bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] });

        res.json({
            bookingCode: updatedBooking.bookingCode,
            movieTitle: updatedBooking.showtime?.movie?.title || '',
            cinemaName: updatedBooking.showtime?.cinema?.name || '',
            showTime: updatedBooking.showtime?.startTime || '',
            showDate: updatedBooking.showtime?.date
                ? new Date(updatedBooking.showtime.date).toLocaleDateString('vi-VN') : '',
            selectedSeats: updatedBooking.seatNumbers || [],
            finalTotalPrice: updatedBooking.totalPrice,
            poster: updatedBooking.showtime?.movie?.poster || '',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function processSuccessfulPayment(bookingId, transactionId, amount) {
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'pending') return;

    const payment = new Payment({
        booking: bookingId,
        method: 'momo',
        amount,
        transactionId,
        status: 'success',
        paymentDate: new Date(),
    });
    await payment.save();

    booking.status = 'paid';
    booking.paymentId = payment._id;
    await booking.save();

    await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'booked' });
}

module.exports = router;
