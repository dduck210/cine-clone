require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

// Set screening end date to 30 days from today for now_showing movies without one
const DEFAULT_DAYS = 30;

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    const missing = await Movie.find({
        status: 'now_showing',
        $or: [{ screeningEndDate: { $exists: false } }, { screeningEndDate: null }],
    }).select('title');

    console.log(`Found ${missing.length} now_showing movie(s) without screeningEndDate:`);
    missing.forEach(m => console.log(' -', m.title));

    if (missing.length === 0) { console.log('Nothing to fix.'); process.exit(0); }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + DEFAULT_DAYS);

    const ids = missing.map(m => m._id);
    await Movie.updateMany({ _id: { $in: ids } }, { $set: { screeningEndDate: endDate } });

    console.log(`\nSet screeningEndDate = ${endDate.toLocaleDateString('vi-VN')} (+${DEFAULT_DAYS} ngày) for ${missing.length} movies.`);
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
