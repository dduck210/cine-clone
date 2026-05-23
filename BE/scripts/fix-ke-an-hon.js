require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const r = await Movie.updateOne(
        { title: 'Kẻ Ăn Hồn' },
        { $set: { trailer: 'https://www.youtube.com/watch?v=xWh0g4rKGjI' } }
    );
    console.log('matched:', r.matchedCount, 'modified:', r.modifiedCount);
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
