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

// Weekend time slots — 3 per movie per day
const TIME_SLOTS = ['09:30', '11:45', '14:00', '16:15', '19:00', '21:15'];
const BASE_PRICES = [75000, 80000, 85000, 90000, 95000, 100000];

// Target dates
const DATES = [
    new Date('2026-05-23T00:00:00+07:00'),
    new Date('2026-05-24T00:00:00+07:00'),
];

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
        const seatPrice = showtime.priceConfig[seatType];
        for (let j = 1; j <= room.cols; j++) {
            seats.push({
                showtime: showtime._id,
                room: room._id,
                row,
                col: j,
                seatNumber: `${row}${j}`,
                type: seatType,
                status: 'available',
                price: seatPrice,
            });
        }
    }
    if (seats.length > 0) {
        await Seat.insertMany(seats, { ordered: false });
    }
    return seats.length;
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Get all cinemas (exclude stopped) and their active rooms
    const cinemas = await Cinema.find({ status: { $in: ['active', 'incident'] } }).lean();
    console.log(`Cinemas: ${cinemas.length}`);

    const allRooms = await CinemaRoom.find({ status: 'active' }).lean();
    console.log(`Active rooms: ${allRooms.length}`);

    const roomsByCinema = {};
    allRooms.forEach(r => {
        const key = r.cinema.toString();
        if (!roomsByCinema[key]) roomsByCinema[key] = [];
        roomsByCinema[key].push(r);
    });

    // Filter cinemas that have at least 1 room and a usable room (totalSeats > 1)
    const usableCinemas = cinemas.filter(c => {
        const rooms = roomsByCinema[c._id.toString()] || [];
        return rooms.some(r => r.totalSeats > 1);
    });
    console.log(`Usable cinemas: ${usableCinemas.length}`);

    const movies = await Movie.find({ status: 'now_showing' }, '_id title duration').lean();
    console.log(`Now showing movies: ${movies.length}`);

    let totalShowtimes = 0;
    let totalSeats = 0;
    let skipped = 0;

    for (const targetDate of DATES) {
        console.log(`\n── ${dayLabel(targetDate)} ──`);

        for (let idx = 0; idx < movies.length; idx++) {
            const movie = movies[idx];
            const duration = movie.duration || 120;

            for (const cinema of usableCinemas) {
                const cinemaRooms = roomsByCinema[cinema._id.toString()] || [];
                const usableRooms = cinemaRooms.filter(r => r.totalSeats > 1);
                if (!usableRooms.length) continue;

                // Each movie rotates through rooms
                const room = usableRooms[idx % usableRooms.length];

                // Pick 3 staggered time slots (weekend), offset by movie index
                const slotOffset = idx % 3;
                const slots = [
                    TIME_SLOTS[slotOffset * 2 % TIME_SLOTS.length],
                    TIME_SLOTS[(slotOffset * 2 + 2) % TIME_SLOTS.length],
                    TIME_SLOTS[5], // always include a night slot
                ];
                const uniqueSlots = [...new Set(slots)];

                for (const startTime of uniqueSlots) {
                    // Skip if showtime already exists for this movie/cinema/room/date/time
                    const exists = await Showtime.findOne({
                        movie: movie._id,
                        cinema: cinema._id,
                        room: room._id,
                        date: targetDate,
                        startTime,
                    });
                    if (exists) { skipped++; continue; }

                    const basePrice = BASE_PRICES[idx % BASE_PRICES.length];
                    const timeSlot = getTimeSlot(startTime);
                    const dayType = getDayTypeFromDate(targetDate);
                    const endTime = calcEndTime(startTime, duration);
                    const priceConfig = calcPriceConfig(basePrice, timeSlot, dayType);

                    const showtime = await Showtime.create({
                        movie: movie._id,
                        cinema: cinema._id,
                        room: room._id,
                        date: targetDate,
                        startTime,
                        endTime,
                        basePrice,
                        priceConfig,
                        timeSlot,
                        dayType,
                        totalSeats: room.totalSeats,
                        availableSeats: room.totalSeats,
                        status: 'active',
                    });

                    const seatsAdded = await createSeatsForShowtime(showtime, room);
                    totalShowtimes++;
                    totalSeats += seatsAdded;
                }
            }
        }
        console.log(`  Added so far: ${totalShowtimes} showtimes`);
    }

    console.log(`\n── Done ──`);
    console.log(`Created: ${totalShowtimes} showtimes`);
    console.log(`Created: ${totalSeats} seats`);
    console.log(`Skipped (already existed): ${skipped}`);

    await mongoose.disconnect();
    console.log('Disconnected');
}

run().catch(err => { console.error(err); process.exit(1); });
