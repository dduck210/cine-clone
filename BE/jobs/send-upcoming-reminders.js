const cron = require('node-cron');
const Booking = require('../models/Booking');
const { getShowtimeDateTime } = require('../utils/showtime-status');
const { sendShowtimeReminderEmail } = require('../services/email-service');

async function sendUpcomingReminders() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
        status: 'paid',
        reminder24hSentAt: { $exists: false },
    })
        .populate('user', 'name email')
        .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title' },
                { path: 'cinema', select: 'name address' },
                { path: 'room', select: 'name' },
            ],
        });

    let sentCount = 0;

    for (const booking of bookings) {
        const showtime = booking.showtime;
        if (!showtime || showtime.status !== 'active') continue;

        const startDateTime = getShowtimeDateTime(showtime, false);
        if (!startDateTime) continue;
        if (startDateTime <= now || startDateTime > in24Hours) continue;

        const result = await sendShowtimeReminderEmail(booking);
        if (result.sent) {
            booking.reminder24hSentAt = new Date();
            await booking.save();
            sentCount++;
        }
    }

    return sentCount;
}

function startUpcomingReminderJob() {
    cron.schedule('0 * * * *', async () => {
        try {
            const count = await sendUpcomingReminders();
            if (count > 0) {
                console.log(`[cron] Sent ${count} upcoming reminder email(s)`);
            }
        } catch (error) {
            console.error('[cron] send-upcoming-reminders error:', error.message);
        }
    });

    console.log('[cron] send-upcoming-reminders job started');
}

module.exports = {
    sendUpcomingReminders,
    startUpcomingReminderJob,
};
