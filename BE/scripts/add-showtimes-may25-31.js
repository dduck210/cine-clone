require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const { getTimeSlot, getDayTypeFromDate, calcEndTime, calcPriceConfig } = require('../utils/pricing');

const TIME_SLOTS = ['09:30', '11:45', '14:00', '16:15', '19:00', '21:15'];
const BASE_PRICES = [75000, 80000, 85000, 90000, 95000, 100000];

// May 25–31, 2026
const DATES = [25, 26, 27, 28, 29, 30, 31].map(d => new Date(`2026-05-${String(d).padStart(2,'0')}T00:00:00+07:00`));

function dayLabel(d) {
    return d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

async function createSeatsForShowtime(showtime, room) {
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
    if (seats.length > 0) await Seat.insertMany(seats, { ordered: false });
    return seats.length;
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const cinemas = await Cinema.find({ status: { $in: ['active', 'incident'] } }).lean();
    const allRooms = await CinemaRoom.find({ status: 'active' }).lean();

    const roomsByCinema = {};
    allRooms.forEach(r => {
        const key = r.cinema.toString();
        if (!roomsByCinema[key]) roomsByCinema[key] = [];
        roomsByCinema[key].push(r);
    });

    const usableCinemas = cinemas.filter(c =>
        (roomsByCinema[c._id.toString()] || []).some(r => r.totalSeats > 1)
    );

    const movies = await Movie.find({ status: 'now_showing' }, '_id title duration').lean();
    console.log(`Movies: ${movies.length} | Cinemas: ${usableCinemas.length} | Dates: ${DATES.length}`);

    let totalShowtimes = 0, totalSeats = 0, skipped = 0;

    for (const targetDate of DATES) {
        const isWeekend = [0, 6].includes(new Date(targetDate.getTime() + 7 * 3600000).getUTCDay());
        process.stdout.write(`${dayLabel(targetDate)} (${isWeekend ? 'cuối tuần' : 'thường'}) ... `);

        let dayCount = 0;

        for (let idx = 0; idx < movies.length; idx++) {
            const movie = movies[idx];
            const duration = movie.duration || 120;

            for (const cinema of usableCinemas) {
                const usableRooms = (roomsByCinema[cinema._id.toString()] || []).filter(r => r.totalSeats > 1);
                if (!usableRooms.length) continue;

                const room = usableRooms[idx % usableRooms.length];

                // 3 staggered slots; weekends get the full night slot too
                const slotOffset = idx % 3;
                const slots = new Set([
                    TIME_SLOTS[slotOffset * 2 % TIME_SLOTS.length],
                    TIME_SLOTS[(slotOffset * 2 + 2) % TIME_SLOTS.length],
                    ...(isWeekend ? [TIME_SLOTS[5]] : [TIME_SLOTS[4]]),
                ]);

                for (const startTime of slots) {
                    const exists = await Showtime.findOne({
                        movie: movie._id, cinema: cinema._id, room: room._id,
                        date: targetDate, startTime,
                    }).lean();
                    if (exists) { skipped++; continue; }

                    const basePrice  = BASE_PRICES[idx % BASE_PRICES.length];
                    const timeSlot   = getTimeSlot(startTime);
                    const dayType    = getDayTypeFromDate(targetDate);
                    const endTime    = calcEndTime(startTime, duration);
                    const priceConfig = calcPriceConfig(basePrice, timeSlot, dayType);

                    const showtime = await Showtime.create({
                        movie: movie._id, cinema: cinema._id, room: room._id,
                        date: targetDate, startTime, endTime,
                        basePrice, priceConfig, timeSlot, dayType,
                        totalSeats: room.totalSeats, availableSeats: room.totalSeats,
                        status: 'active',
                    });

                    const seatsAdded = await createSeatsForShowtime(showtime, room);
                    totalShowtimes++;
                    totalSeats += seatsAdded;
                    dayCount++;
                }
            }
        }
        console.log(`+${dayCount} suất chiếu`);
    }

    console.log(`\n── Tổng kết ──`);
    console.log(`Tạo mới: ${totalShowtimes} suất chiếu`);
    console.log(`Tạo mới: ${totalSeats} ghế`);
    console.log(`Bỏ qua (đã tồn tại): ${skipped}`);

    await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
