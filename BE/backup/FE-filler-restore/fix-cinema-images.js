require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Cinema = require('./models/Cinema');

const REAL_IMAGES = [
    {
        name: 'Megaplex Cinema',
        image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    },
    {
        name: 'Cineplex Premium',
        image: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&q=80',
    },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('MongoDB Connected');

    for (const item of REAL_IMAGES) {
        const result = await Cinema.updateOne(
            { name: item.name },
            { $set: { image: item.image } }
        );
        console.log(`${item.name}: updated ${result.modifiedCount} doc`);
    }

    // Nếu có rạp nào khác chưa có ảnh, set ảnh mặc định
    await Cinema.updateMany(
        { image: { $in: ['', null, undefined] } },
        { $set: { image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80' } }
    );

    console.log('Done.');
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
