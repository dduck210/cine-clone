const cron = require('node-cron');
const Booking = require('../models/Booking');
require('../models/User');
require('../models/Showtime');
require('../models/Movie');
require('../models/Cinema');
const { sendReminderEmail } = require('../services/email-service');
const { getShowtimeStartDateTime } = require('../utils/showtime-availability');

async function sendUpcomingShowtimeReminders() {
    const now = new Date();
    const reminderWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
        status: 'paid',
        reminder24hSentAt: { $exists: false },
    }).populate([
        { path: 'user', select: 'name email' },
        { path: 'showtime', populate: [{ path: 'movie', select: 'title' }, { path: 'cinema', select: 'name' }] },
    ]);

    let sentCount = 0;
    let failedCount = 0;

    for (const booking of bookings) {
        if (!booking.user?.email || !booking.showtime) continue;

        const showtimeStartAt = getShowtimeStartDateTime(booking.showtime);
        if (!showtimeStartAt) continue;

        if (showtimeStartAt > now && showtimeStartAt <= reminderWindowEnd) {
            try {
                await sendReminderEmail(booking);
                booking.reminder24hSentAt = new Date();
                await booking.save();
                sentCount++;
            } catch (error) {
                failedCount++;
                console.error(
                    `[Reminder Emails] Failed to send reminder for booking ${booking.bookingCode || booking._id}:`,
                    error.message
                );
            }
        }
    }

    if (sentCount > 0) {
        console.log(`[Reminder Emails] Sent ${sentCount} reminder email(s)`);
    }

    if (failedCount > 0) {
        console.error(`[Reminder Emails] ${failedCount} reminder email(s) failed`);
    }

    return sentCount;
}

function startReminderEmailsJob() {
    sendUpcomingShowtimeReminders().catch((err) => {
        console.error('[Reminder Emails] initial run failed:', err);
    });

    cron.schedule('*/30 * * * *', () => {
        sendUpcomingShowtimeReminders().catch((err) => {
            console.error('[Reminder Emails] job failed:', err);
        });
    });
}

module.exports = { sendUpcomingShowtimeReminders, startReminderEmailsJob };
