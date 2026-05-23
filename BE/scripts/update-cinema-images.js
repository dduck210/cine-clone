require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Cinema = require('../models/Cinema');

// Real cinema interior photos from Unsplash (free-to-use)
const CINEMA_IMAGES = [
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    'https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=800&q=80',
    'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=800&q=80',
];

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected\n');

    const cinemas = await Cinema.find({});
    console.log(`Found ${cinemas.length} cinemas\n`);

    for (let i = 0; i < cinemas.length; i++) {
        const c = cinemas[i];
        if (c.image) {
            console.log(`SKIP  ${c.name} (already has image)`);
            continue;
        }
        const img = CINEMA_IMAGES[i % CINEMA_IMAGES.length];
        await Cinema.updateOne({ _id: c._id }, { $set: { image: img } });
        console.log(`SET   ${c.name} → ${img}`);
    }

    console.log('\nDone.');
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
