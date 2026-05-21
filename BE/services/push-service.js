const webPush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

let initialized = false;

function init() {
    if (initialized) return;
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
    webPush.setVapidDetails(
        VAPID_SUBJECT || 'mailto:support@5cine.vn',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY,
    );
    initialized = true;
}

async function sendTicketPushNotification(booking) {
    init();
    if (!initialized) return;

    const subs = await PushSubscription.find({ bookingCode: booking.bookingCode });
    if (!subs.length) return;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const payload = JSON.stringify({
        title: '✅ Vé đã được xác nhận!',
        body: `${booking.bookingCode} — ${booking.showtime?.movie?.title || 'Phim'} đã sẵn sàng vào rạp.`,
        url: `${frontendUrl}/ticket/${booking.bookingCode}`,
    });

    const results = await Promise.allSettled(
        subs.map(sub =>
            webPush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
                payload,
            ).catch(err => {
                if (err.statusCode === 410) return PushSubscription.deleteOne({ _id: sub._id });
                throw err;
            })
        )
    );

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed) console.warn(`[push] ${failed}/${subs.length} push notifications failed`);
}

module.exports = { sendTicketPushNotification };
