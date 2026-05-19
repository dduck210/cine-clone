const cron = require('node-cron');
const Showtime = require('../models/Showtime');
const { isShowtimeExpired } = require('../utils/showtime-status');
const notificationService = require('../services/notification-service');

async function expireShowtimes() {
    const activeShowtimes = await Showtime.find({ status: 'active' });
    const now = new Date();
    const expiredIds = activeShowtimes
        .filter((showtime) => isShowtimeExpired(showtime, now, false))
        .map((showtime) => showtime._id);

    if (expiredIds.length === 0) return 0;

    await Showtime.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: 'expired' } }
    );

    // Notify admin clients that showtimes have been expired so UI can refresh
    try {
        notificationService.createNotification({
            type: 'showtime_expired',
            title: 'Cập nhật suất chiếu',
            message: `${expiredIds.length} suất chiếu đã được đánh dấu hết hạn`,
            data: { count: expiredIds.length, ids: expiredIds },
        });
    } catch (err) {
        // ignore notification errors
    }

    return expiredIds.length;
}

function startExpireShowtimesJob() {
    // Run every minute to expire showtimes promptly
    cron.schedule('* * * * *', async () => {
        try {
            const count = await expireShowtimes();
            if (count > 0) {
                console.log(`[cron] Expired ${count} showtime(s)`);
            }
        } catch (error) {
            console.error('[cron] expire-showtimes error:', error.message);
        }
    });

    expireShowtimes()
        .then((count) => {
            console.log(`[cron] expire-showtimes job started${count > 0 ? ` (${count} updated on boot)` : ''}`);
        })
        .catch((error) => {
            console.error('[cron] expire-showtimes bootstrap error:', error.message);
        });
}

module.exports = {
    expireShowtimes,
    startExpireShowtimesJob,
};
