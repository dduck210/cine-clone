require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Seat = require('../models/Seat');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    // Show a few existing showtimes to understand structure
    const samples = await Showtime.find({})
        .sort({ startTime: -1 })
        .limit(5)
        .populate('movie', 'title duration')
        .populate('cinema', 'name')
        .populate('room', 'name')
        .lean();

    console.log('=== Recent Showtimes (sample) ===');
    for (const s of samples) {
        console.log(JSON.stringify({
            movie: s.movie?.title,
            cinema: s.cinema?.name,
            room: s.room?.name,
            startTime: s.startTime,
            endTime: s.endTime,
            format: s.format,
            language: s.language,
            basePrice: s.basePrice,
            status: s.status,
        }, null, 2));
    }

    // Show cinema rooms details
    console.log('\n=== Rooms ===');
    const rooms = await CinemaRoom.find({ status: 'active' }).populate('cinema', 'name').lean();
    for (const r of rooms) {
        const seatCount = await Seat.countDocuments({ room: r._id });
        console.log(`Room: ${r.name} | Cinema: ${r.cinema?.name} | _id: ${r._id} | seats: ${seatCount}`);
    }

    // Date range of existing showtimes
    const oldest = await Showtime.findOne({}).sort({ startTime: 1 }).lean();
    const newest = await Showtime.findOne({}).sort({ startTime: -1 }).lean();
    console.log('\nShowtime date range:', oldest?.startTime, '→', newest?.startTime);
    console.log('Total showtimes:', await Showtime.countDocuments({}));

    await mongoose.disconnect();
}

run().catch(console.error);
