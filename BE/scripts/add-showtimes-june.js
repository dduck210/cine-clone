require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const Movie      = require('../models/Movie');
const Cinema     = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Showtime   = require('../models/Showtime');
const Seat       = require('../models/Seat');
const { getTimeSlot, getDayTypeFromDate, calcEndTime, calcPriceConfig } = require('../utils/pricing');

const TIME_SLOTS  = ['09:30', '12:00', '14:30', '17:00', '19:30', '21:45'];
const BASE_PRICES = { Standard: 75000, VIP: 100000, IMAX: 130000, '4DX': 120000 };

function buildDateRange(days) {
    const dates = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < days; i++) {
        dates.push(new Date(start.getTime() + i * 86400000));
    }
    return dates;
}

async function createSeats(showtime, room) {
    if (!room.rows || !room.cols) return 0;
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
                price: showtime.priceConfig?.[seatType] || showtime.basePrice,
            });
        }
    }
    if (seats.length) await Seat.insertMany(seats, { ordered: false });
    return seats.length;
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected\n');

    const cinemas = await Cinema.find({ status: 'active' }).lean();
    console.log('Rạp active:', cinemas.map(c => c.name).join(', '));

    const allRooms = await CinemaRoom.find({
        cinema: { $in: cinemas.map(c => c._id) },
        status: 'active',
        totalSeats: { $gt: 1 },
    }).lean();
    console.log('Phòng active:', allRooms.map(r => r.name).join(', '), '\n');

    const roomsByCinema = {};
    allRooms.forEach(r => {
        const key = r.cinema.toString();
        if (!roomsByCinema[key]) roomsByCinema[key] = [];
        roomsByCinema[key].push(r);
    });

    const movies = await Movie.find({ status: 'now_showing' }, '_id title duration').lean();
    console.log(`Phim đang chiếu: ${movies.length}`);

    // 7 days from today
    const dates = buildDateRange(7);
    console.log(`Ngày: ${dates[0].toLocaleDateString('vi-VN')} → ${dates[dates.length-1].toLocaleDateString('vi-VN')}\n`);

    let totalNew = 0, totalSkipped = 0, totalSeats = 0;

    for (const targetDate of dates) {
        for (let idx = 0; idx < movies.length; idx++) {
            const movie = movies[idx];
            const duration = movie.duration || 120;

            for (const cinema of cinemas) {
                const rooms = roomsByCinema[cinema._id.toString()] || [];
                if (!rooms.length) continue;

                // Assign room by rotating per movie index
                const room = rooms[idx % rooms.length];
                const basePrice = BASE_PRICES[room.roomType] || 75000;

                // 3 slots per movie per cinema per day
                const slotIndexes = [
                    (idx * 2) % TIME_SLOTS.length,
                    (idx * 2 + 2) % TIME_SLOTS.length,
                    (idx * 2 + 4) % TIME_SLOTS.length,
                ];
                const slots = [...new Set(slotIndexes.map(i => TIME_SLOTS[i]))];

                for (const startTime of slots) {
                    // Skip conflict: same room, same date, overlapping time
                    const conflict = await Showtime.findOne({
                        room: room._id,
                        date: targetDate,
                        startTime,
                        status: 'active',
                    }).lean();
                    if (conflict) { totalSkipped++; continue; }

                    const timeSlot    = getTimeSlot(startTime);
                    const dayType     = getDayTypeFromDate(targetDate);
                    const endTime     = calcEndTime(startTime, duration);
                    const priceConfig = calcPriceConfig(basePrice, timeSlot, dayType);

                    const st = await Showtime.create({
                        movie: movie._id,
                        cinema: cinema._id,
                        room: room._id,
                        date: targetDate,
                        startTime, endTime,
                        basePrice, priceConfig, timeSlot, dayType,
                        totalSeats: room.totalSeats,
                        availableSeats: room.totalSeats,
                        status: 'active',
                    });

                    const seatCount = await createSeats(st, room);
                    totalNew++;
                    totalSeats += seatCount;
                }
            }
        }
    }

    console.log(`\nDone! Tạo ${totalNew} suất chiếu mới | ${totalSeats} ghế | Bỏ qua ${totalSkipped} (trùng)`);
    await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
