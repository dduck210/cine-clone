require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('../models/CinemaRoom');
require('../models/Cinema');
require('../models/Movie');
const Showtime = require('../models/Showtime');

const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const overlaps = (as, ae, bs, be) => {
    if (ae <= as) ae += 1440;
    if (be <= bs) be += 1440;
    return as < be && bs < ae;
};

// Simulate FE formatConflictMsg
function formatConflictMsg(e) {
    const dateStr = e.date ? new Date(e.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
    const prefix = dateStr ? `[${dateStr}] ` : '';
    if (e.conflicts?.length > 0) {
        const list = e.conflicts.map(c => {
            const m = c.conflictMovie ? `"${c.conflictMovie}" ` : '';
            return `${m}(${c.conflictStart} → ${c.conflictEnd})`;
        }).join(', ');
        return `${prefix}Suất ${e.startTime} bị trùng với: ${list} — phòng chưa trống.`;
    }
    return `${prefix}Suất ${e.startTime}: ${e.error}`;
}

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const date = '2026-05-27';
    const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

    // Test cases: try creating these showtimes and see what conflict errors come out
    const testCases = [
        { label: 'Doraemon lúc 10:00 vào Room D (Megaplex HN)', roomName: 'Room D', cinemaName: '5Cine Megaplex Hà Nội', startTime: '10:00', endTime: '12:15' },
        { label: 'Phim X lúc 10:00 vào Room B VIP (Megaplex HN)', roomName: 'Room B (VIP)', cinemaName: '5Cine Megaplex Hà Nội', startTime: '10:00', endTime: '12:15' },
        { label: 'Phim X lúc 08:00 vào Room D (Megaplex HN) — phim dài 5 tiếng', roomName: 'Room D', cinemaName: '5Cine Megaplex Hà Nội', startTime: '08:00', endTime: '14:00' },
    ];

    for (const tc of testCases) {
        // Find the room
        const CinemaRoom = mongoose.model('CinemaRoom');
        const Cinema = mongoose.model('Cinema');
        const cinema = await Cinema.findOne({ name: { $regex: tc.cinemaName, $options: 'i' } }).lean();
        if (!cinema) { console.log(`Cinema not found: ${tc.cinemaName}`); continue; }
        const room = await CinemaRoom.findOne({ cinema: cinema._id, name: tc.roomName }).lean();
        if (!room) { console.log(`Room not found: ${tc.roomName}`); continue; }

        const candidates = await Showtime.find({
            room: room._id,
            date: { $gte: dayStart, $lt: dayEnd },
            status: 'active',
        }).populate('movie', 'title').select('startTime endTime movie').lean();

        const newStartMin = toMin(tc.startTime);
        const newEndMin   = toMin(tc.endTime);
        const roomConflicts = candidates.filter(st =>
            overlaps(newStartMin, newEndMin, toMin(st.startTime), toMin(st.endTime))
        );

        console.log('\n─────────────────────────────────────────');
        console.log('TEST:', tc.label);
        if (roomConflicts.length === 0) {
            console.log('  ✅ Không có conflict — tạo được');
        } else {
            const errorPayload = {
                date,
                startTime: tc.startTime,
                error: 'Room conflict',
                conflicts: roomConflicts.map(st => ({
                    conflictStart: st.startTime,
                    conflictEnd: st.endTime,
                    conflictMovie: st.movie?.title || null,
                })),
            };
            console.log('  ❌ Conflict payload:', JSON.stringify(errorPayload.conflicts, null, 4));
            console.log('  📢 Thông báo FE:', formatConflictMsg(errorPayload));
        }
    }

    mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
