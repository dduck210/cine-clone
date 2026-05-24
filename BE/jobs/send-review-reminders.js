const cron = require('node-cron');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { getShowtimeDateTime } = require('../utils/showtime-status');
const { sendReviewReminderEmail } = require('../services/email-service');

async function sendReviewReminders() {
    const now = new Date();

    const bookings = await Booking.find({
        status: 'paid',
        reviewReminderSentAt: { $exists: false },
    })
        .populate('user', 'name email')
        .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title _id' },
                { path: 'cinema', select: 'name' },
                { path: 'room', select: 'name' },
            ],
        });

    let sentCount = 0;

    for (const booking of bookings) {
        const showtime = booking.showtime;
        if (!showtime || showtime.status === 'cancelled') continue;

        // Only send after the showtime has ended
        const endDateTime = getShowtimeDateTime(showtime, true);
        if (!endDateTime || endDateTime > now) continue;

        // Skip if user already reviewed this movie
        const movieId = showtime.movie?._id;
        if (!movieId) continue;
        const alreadyReviewed = await Review.exists({ user: booking.user._id, movie: movieId });
        if (alreadyReviewed) {
            // Mark to avoid checking again on next run
            booking.reviewReminderSentAt = new Date();
            await booking.save();
            continue;
        }

        const result = await sendReviewReminderEmail(booking);
        if (result.sent || result.skipped) {
            booking.reviewReminderSentAt = new Date();
            await booking.save();
            if (result.sent) sentCount++;
        }
    }

    return sentCount;
}

function startReviewReminderJob() {
    // Run every hour, 30 minutes past (offset from other hourly jobs)
    cron.schedule('30 * * * *', async () => {
        try {
            const count = await sendReviewReminders();
            if (count > 0) {
                console.log(`[cron] Sent ${count} review reminder email(s)`);
            }
        } catch (error) {
            console.error('[cron] send-review-reminders error:', error.message);
        }
    });

    console.log('[cron] send-review-reminders job started');
}

module.exports = {
    sendReviewReminders,
    startReviewReminderJob,
};
