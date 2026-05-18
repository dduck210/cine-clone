const cron = require('node-cron');
const Showtime = require('../models/Showtime');
const { getShowtimeStartDateTime } = require('../utils/showtime-availability');

async function expirePastShowtimes() {
    const now = new Date();
    const activeShowtimes = await Showtime.find({ status: 'active' }).select('_id date startTime');
    const expiredIds = activeShowtimes
        .filter((showtime) => {
            const startAt = getShowtimeStartDateTime(showtime);
            return startAt && startAt < now;
        })
        .map((showtime) => showtime._id);

    if (expiredIds.length === 0) {
        return { modifiedCount: 0 };
    }

    const result = await Showtime.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: 'expired' } }
    );

    if (result.modifiedCount > 0) {
        console.log(`[Expire Showtimes] ${result.modifiedCount} showtimes marked expired`);
    }

    return result;
}

function startExpireShowtimesJob() {
    expirePastShowtimes().catch((err) => console.error('[Expire Showtimes] initial run failed:', err));
    cron.schedule('*/10 * * * *', () => {
        expirePastShowtimes().catch((err) => console.error('[Expire Showtimes] job failed:', err));
    });
}

module.exports = { expirePastShowtimes, startExpireShowtimesJob };
