require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function main() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    const Showtime = require('../models/Showtime');

    // Find all active showtimes, grouped by cinema + date + startTime
    const duplicates = await Showtime.aggregate([
        { $match: { status: 'active' } },
        {
            $group: {
                _id: {
                    cinema: '$cinema',
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    startTime: '$startTime',
                },
                count: { $sum: 1 },
                ids: { $push: '$_id' },
                rooms: { $push: '$room' },
            },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { '_id.date': 1, '_id.startTime': 1 } },
    ]);

    if (duplicates.length === 0) {
        console.log('✅ No duplicate showtimes found.');
        await mongoose.disconnect();
        return;
    }

    // Populate cinema and room names for readable output
    const Cinema = require('../models/Cinema');
    const CinemaRoom = require('../models/CinemaRoom');

    console.log(`⚠️  Found ${duplicates.length} duplicate group(s):\n`);
    for (const dup of duplicates) {
        const cinema = await Cinema.findById(dup._id.cinema).select('name');
        const roomNames = await CinemaRoom.find({ _id: { $in: dup.rooms } }).select('name');
        const roomList = roomNames.map(r => r.name).join(', ');
        console.log(`Rạp: ${cinema?.name || dup._id.cinema}`);
        console.log(`  Ngày: ${dup._id.date}  |  Giờ: ${dup._id.startTime}`);
        console.log(`  Phòng: ${roomList}`);
        console.log(`  IDs cần xóa (giữ 1, xóa phần còn lại):`);
        dup.ids.forEach((id, i) => console.log(`    [${i}] ${id}`));
        console.log();
    }

    console.log('--- Để xóa duplicate, chạy: node scripts/fix-showtime-duplicates.js');
    await mongoose.disconnect();
}

main().catch(console.error);
