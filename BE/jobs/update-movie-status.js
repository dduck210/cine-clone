const cron = require('node-cron');
const Movie = require('../models/Movie');

async function updateMovieStatus() {
    const today = new Date();
    // No need to set hours to 0 if we use $lte, but usually releaseDate is at 00:00:00
    
    const result = await Movie.updateMany(
        {
            status: 'coming_soon',
            releaseDate: { $lte: today }
        },
        {
            $set: { status: 'now_showing' }
        }
    );

    return result.modifiedCount;
}

function startUpdateMovieStatusJob() {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        try {
            const count = await updateMovieStatus();
            if (count > 0) {
                console.log(`[cron] Updated ${count} movie(s) to now_showing`);
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
