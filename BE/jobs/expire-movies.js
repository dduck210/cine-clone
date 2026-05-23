const cron = require('node-cron');
const Movie = require('../models/Movie');

async function expireMovies() {
    const now = new Date();
    const result = await Movie.updateMany(
        { status: 'now_showing', screeningEndDate: { $lt: now } },
        { $set: { status: 'stopped' } }
    );
    return result.modifiedCount;
}

function startExpireMoviesJob() {
    // Run every hour to auto-stop movies past their screening end date
    cron.schedule('0 * * * *', async () => {
        try {
            const count = await expireMovies();
            if (count > 0) console.log(`[cron] Stopped ${count} movie(s) past screening end date`);
        } catch (error) {
            console.error('[cron] expire-movies error:', error.message);
        }
    });

    expireMovies()
        .then((count) => {
            console.log(`[cron] expire-movies job started${count > 0 ? ` (${count} updated on boot)` : ''}`);
        })
        .catch((error) => {
            console.error('[cron] expire-movies bootstrap error:', error.message);
        });
}

module.exports = { expireMovies, startExpireMoviesJob };
