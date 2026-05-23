require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    const missing = await Movie.find({
        $or: [{ releaseDate: { $exists: false } }, { releaseDate: null }],
    }).select('title status createdAt');

    console.log(`Found ${missing.length} movie(s) without releaseDate:`);
    missing.forEach(m => console.log(` - [${m.status}] ${m.title}`));

    if (missing.length === 0) { console.log('Nothing to fix.'); process.exit(0); }

    // now_showing → release date = 30 days before today (already out)
    // coming_soon → release date = 30 days from today (upcoming)
    // stopped     → release date = 60 days before today
    const now = new Date();
    for (const movie of missing) {
        let releaseDate;
        if (movie.status === 'now_showing') {
            releaseDate = new Date(now); releaseDate.setDate(now.getDate() - 30);
        } else if (movie.status === 'coming_soon') {
            releaseDate = new Date(now); releaseDate.setDate(now.getDate() + 30);
        } else {
            releaseDate = new Date(now); releaseDate.setDate(now.getDate() - 60);
        }
        await Movie.updateOne({ _id: movie._id }, { $set: { releaseDate } });
        console.log(`  SET ${movie.title} → ${releaseDate.toLocaleDateString('vi-VN')}`);
    }

    console.log(`\nDone. Updated ${missing.length} movies.`);
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
