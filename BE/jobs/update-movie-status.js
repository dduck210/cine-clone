const cron = require('node-cron');
const Movie = require('../models/Movie');

async function updateMovieStatus() {
    // We find movies that need update and call .save() to trigger pre-save logic
    const now = new Date();
    const moviesToUpdate = await Movie.find({
        $or: [
            { status: 'coming_soon', releaseDate: { $lte: now } },
            { status: 'now_showing', releaseDate: { $gt: now } },
            { status: 'now_showing', screeningEndDate: { $lt: now } }
        ]
    });

    for (const movie of moviesToUpdate) {
        await movie.save();
    }

    return moviesToUpdate.length;
}

function startUpdateMovieStatusJob() {
    // Run every minute to ensure status is updated promptly
    cron.schedule('* * * * *', async () => {
        try {
            const count = await updateMovieStatus();
            if (count > 0) {
                console.log(`[cron] Updated ${count} movie(s) status`);
            }
        } catch (error) {
            console.error('[cron] update-movie-status error:', error.message);
        }
    });

    // Also run on startup
    updateMovieStatus()
        .then((count) => {
            console.log(`[cron] update-movie-status job started${count > 0 ? ` (${count} updated on boot)` : ''}`);
        })
        .catch((error) => {
            console.error('[cron] update-movie-status bootstrap error:', error.message);
        });
}

module.exports = {
    updateMovieStatus,
    startUpdateMovieStatusJob,
};
