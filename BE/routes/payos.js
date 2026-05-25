const express = require('express');
const router = express.Router();
const { PayOS } = require('@payos/node');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const { protect } = require('../middleware/auth');
const { sendPaymentSuccessEmail, sendAdminPaymentNotificationEmail } = require('../services/email-service');
const notificationService = require('../services/notification-service');

const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID || '',
    process.env.PAYOS_API_KEY || '',
    process.env.PAYOS_CHECKSUM_KEY || ''
);

// POST /api/payments/payos/create — tạo payment link
router.post('/create', protect, async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const orderCode = Date.now();
        const description = `5CINE ${booking.bookingCode}`.substring(0, 25);

        const paymentLink = await payos.createPaymentLink({
            orderCode,
            amount: booking.totalPrice,
            description,
            cancelUrl: `${process.env.FRONTEND_URL}/payment`,
            returnUrl: `${process.env.FRONTEND_URL}/payment-success`,
        });

        await Booking.findByIdAndUpdate(bookingId, { payosOrderCode: orderCode });

        res.json({
            qrCode: paymentLink.qrCode,
            checkoutUrl: paymentLink.checkoutUrl,
            orderCode,
        });
    } catch (err) {
        console.error('[payos] Create error:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/payments/payos/webhook — PayOS gọi khi thanh toán thành công
router.post('/webhook', async (req, res) => {
    try {
        const webhookData = payos.verifyPaymentWebhookData(req.body);

        if (webhookData.code === '00' || req.body?.data?.code === '00') {
            const orderCode = webhookData.orderCode || req.body?.data?.orderCode;
            if (!orderCode) return res.json({ code: '00', desc: 'success' });

            const booking = await Booking.findOne({ payosOrderCode: orderCode, status: 'pending' });
            if (booking) {
                await processSuccessfulPayment(booking._id, `PAYOS_${orderCode}`, webhookData.amount || booking.totalPrice);
            }
        }
    } catch (err) {
        console.error('[payos] Webhook error:', err.message);
    }

    res.json({ code: '00', desc: 'success' });
});

// GET /api/payments/payos/status/:bookingId — FE poll trạng thái
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
    } catch (err) {
        res.status(500).json({ message: err.message });
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
