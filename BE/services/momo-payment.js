const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const { sendPaymentSuccessEmail, sendAdminPaymentNotificationEmail } = require('./email-service');
const notificationService = require('./notification-service');

const PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO';
const ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
const SECRET_KEY = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const MOMO_API = process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';

const hmac = (data) => crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');

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
    sendAdminPaymentNotificationEmail(bookingContext, 'momo').catch(() => {});
    notificationService.createNotification({
        type: 'payment_paid',
        title: 'Thanh toán MoMo thành công',
        message: `${bookingContext?.user?.name || 'Khách hàng'} vừa thanh toán đơn ${bookingContext?.bookingCode}`,
        data: { bookingId: bookingContext?._id?.toString(), bookingCode: bookingContext?.bookingCode },
    });
}

module.exports = { PARTNER_CODE, ACCESS_KEY, SECRET_KEY, MOMO_API, hmac, processSuccessfulPayment };
