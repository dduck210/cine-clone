require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const Showtime = require('../models/Showtime');
const Cinema = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const cinemas = await Cinema.find({}, '_id name status').lean();
    const rooms = await CinemaRoom.find({}, '_id name cinema status totalSeats').lean();

    console.log('=== Tất cả rạp ===');
    for (const c of cinemas) {
        const cRooms = rooms.filter(r => r.cinema.toString() === c._id.toString());
        console.log(`[${c.status}] ${c.name} (${c._id})`);
        for (const r of cRooms) {
            console.log(`  room: ${r.name} | status: ${r.status} | totalSeats: ${r.totalSeats} | _id: ${r._id}`);
        }
    }

    console.log('\n=== Suất chiếu theo rạp × ngày (23/5 → 10/6) ===');
    const start = new Date('2026-05-23T00:00:00+07:00');
    const end   = new Date('2026-06-10T23:59:59+07:00');

    for (const c of cinemas) {
        const total = await Showtime.countDocuments({ cinema: c._id, date: { $gte: start, $lte: end } });
        console.log(`\n${c.name}: ${total} suất chiếu tổng (23/5–10/6)`);

        // per-day breakdown
        for (let d = new Date('2026-05-23T00:00:00+07:00'); d <= end; d = new Date(d.getTime() + 86400000)) {
            const dayEnd = new Date(d.getTime() + 86399999);
            const cnt = await Showtime.countDocuments({ cinema: c._id, date: { $gte: d, $lte: dayEnd } });
            const label = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            const dow = d.toLocaleDateString('vi-VN', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' });
            const flag = cnt === 0 ? ' ← THIẾU' : '';
            console.log(`  ${label} (${dow}): ${cnt} suất${flag}`);
        }
    }

    await mongoose.disconnect();
}

run().catch(console.error);
