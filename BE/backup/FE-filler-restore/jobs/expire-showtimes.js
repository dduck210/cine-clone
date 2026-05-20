const cron = require('node-cron');
const Showtime = require('../models/Showtime');
const { isShowtimeExpired } = require('../utils/showtime-status');

async function expireShowtimes() {
    const activeShowtimes = await Showtime.find({ status: 'active' });
    const expiredIds = activeShowtimes
        .filter((showtime) => isShowtimeExpired(showtime))
        .map((showtime) => showtime._id);

    if (expiredIds.length === 0) return 0;

    await Showtime.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: 'expired' } }
    );

    return expiredIds.length;
}

function startExpireShowtimesJob() {
    cron.schedule('*/15 * * * *', async () => {
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
