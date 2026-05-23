require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const Movie    = require('../models/Movie');
const Cinema   = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Showtime = require('../models/Showtime');
const Seat     = require('../models/Seat');
const { getTimeSlot, getDayTypeFromDate, calcEndTime, calcPriceConfig } = require('../utils/pricing');

const TIME_SLOTS  = ['09:30', '11:45', '14:00', '16:15', '19:00', '21:15'];
const BASE_PRICES = [75000, 80000, 85000, 90000, 95000, 100000];

// All dates from May 23 → June 10, 2026
function buildDateRange(fromISO, toISO) {
    const dates = [];
    for (let d = new Date(fromISO); d <= new Date(toISO); d = new Date(d.getTime() + 86400000)) {
        dates.push(new Date(d));
    }
    return dates;
}

const ALL_DATES = buildDateRange('2026-05-23T00:00:00+07:00', '2026-06-10T00:00:00+07:00');

function isWeekend(date) {
    const day = new Date(date.getTime() + 7 * 3600000).getUTCDay();
    return day === 0 || day === 6;
}

function dayLabel(d) {
    return d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

async function createSeats(showtime, room) {
    const seats = [];
    for (let i = 0; i < room.rows; i++) {
        const row = String.fromCharCode(65 + i);
        const isCouple = room.rows >= 6 && i === room.rows - 1;
        const isVip    = room.rows >= 6 && i === room.rows - 2;
        const seatType = isCouple ? 'couple' : isVip ? 'vip' : 'normal';
        for (let j = 1; j <= room.cols; j++) {
            seats.push({
                showtime: showtime._id,
                room: room._id,
                row, col: j,
                seatNumber: `${row}${j}`,
                type: seatType,
                status: 'available',
                price: showtime.priceConfig[seatType],
            });
        }
    }
    if (seats.length) await Seat.insertMany(seats, { ordered: false });
    return seats.length;
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected\n');

    // Target cinemas: Megaplex + Cineplex Premium only (by name)
    const targetNames = ['Megaplex Cinema', 'Cineplex Premium'];
    const cinemas = await Cinema.find({ name: { $in: targetNames } }).lean();
    console.log('Rạp mục tiêu:');
    cinemas.forEach(c => console.log(`  [${c.status}] ${c.name}`));

    // Get ALL rooms for these cinemas (regardless of status) with usable seats
    const allRooms = await CinemaRoom.find({
        cinema: { $in: cinemas.map(c => c._id) },
        totalSeats: { $gt: 1 },
    }).lean();
    console.log('\nPhòng chiếu (kể cả maintenance):');
    allRooms.forEach(r => console.log(`  [${r.status}] ${r.name} — ${r.totalSeats} ghế`));

    const roomsByCinema = {};
    allRooms.forEach(r => {
        const key = r.cinema.toString();
        if (!roomsByCinema[key]) roomsByCinema[key] = [];
        roomsByCinema[key].push(r);
    });

    const movies = await Movie.find({ status: 'now_showing' }, '_id title duration').lean();
    console.log(`\nPhim đang chiếu: ${movies.length}`);
    console.log(`Ngày cần kiểm tra: ${ALL_DATES.length} (${dayLabel(ALL_DATES[0])} → ${dayLabel(ALL_DATES[ALL_DATES.length - 1])})\n`);

    let totalNew = 0, totalSeats = 0, totalSkipped = 0;

    for (const targetDate of ALL_DATES) {
        const weekend = isWeekend(targetDate);
        let dayNew = 0;

        for (let idx = 0; idx < movies.length; idx++) {
            const movie = movies[idx];
            const duration = movie.duration || 120;

            for (const cinema of cinemas) {
                const rooms = roomsByCinema[cinema._id.toString()] || [];
                if (!rooms.length) continue;

                const room = rooms[idx % rooms.length];

                // 3 slots per day; weekend = night slot 21:15, weekday = 19:00
                const slotOffset = idx % 3;
                const slots = new Set([
                    TIME_SLOTS[slotOffset * 2 % TIME_SLOTS.length],
                    TIME_SLOTS[(slotOffset * 2 + 2) % TIME_SLOTS.length],
                    weekend ? TIME_SLOTS[5] : TIME_SLOTS[4],
                ]);

                for (const startTime of slots) {
                    const exists = await Showtime.findOne({
                        movie: movie._id, cinema: cinema._id, room: room._id,
                        date: targetDate, startTime,
                    }).lean();
                    if (exists) { totalSkipped++; continue; }

                    const basePrice   = BASE_PRICES[idx % BASE_PRICES.length];
                    const timeSlot    = getTimeSlot(startTime);
                    const dayType     = getDayTypeFromDate(targetDate);
                    const endTime     = calcEndTime(startTime, duration);
                    const priceConfig = calcPriceConfig(basePrice, timeSlot, dayType);

                    const st = await Showtime.create({
                        movie: movie._id, cinema: cinema._id, room: room._id,
                        date: targetDate, startTime, endTime,
                        basePrice, priceConfig, timeSlot, dayType,
                        totalSeats: room.totalSeats,
                        availableSeats: room.totalSeats,
                        status: 'active',
                    });

                    const s = await createSeats(st, room);
                    totalNew++;
                    totalSeats += s;
                    dayNew++;
                }
            }
        }

        const label = `${dayLabel(targetDate)} (${weekend ? 'cuối tuần' : 'thường'})`;
        if (dayNew > 0) console.log(`  ✓ ${label}: +${dayNew} suất chiếu mới`);
        else console.log(`  – ${label}: đã đủ, bỏ qua`);
    }

    console.log(`\n── Tổng kết ──`);
    console.log(`Tạo mới : ${totalNew} suất chiếu`);
    console.log(`Ghế mới : ${totalSeats}`);
    console.log(`Bỏ qua  : ${totalSkipped} (đã tồn tại)`);

    await mongoose.disconnect();
    console.log('Disconnected');
}

run().catch(err => { console.error(err); process.exit(1); });
