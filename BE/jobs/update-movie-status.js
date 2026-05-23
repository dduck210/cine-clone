const cron = require('node-cron');
const Movie = require('../models/Movie');

async function updateMovieStatus() {
    // We find movies that need update and call .save() to trigger pre-save logic
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const moviesToUpdate = await Movie.find({
        $or: [
            // Coming soon but release date is today or earlier
            { status: 'coming_soon', releaseDate: { $lte: today } },
            // Now showing but release date is somehow in the future (e.g. date changed)
            { status: 'now_showing', releaseDate: { $gt: today } },
            // Now showing but screening end date has passed (yesterday or earlier)
            { status: 'now_showing', screeningEndDate: { $lt: today } }
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
