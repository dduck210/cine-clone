require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const start23 = new Date('2026-05-23T00:00:00+07:00');
    const end23   = new Date('2026-05-23T23:59:59+07:00');
    const start24 = new Date('2026-05-24T00:00:00+07:00');
    const end24   = new Date('2026-05-24T23:59:59+07:00');

    const count23 = await Showtime.countDocuments({ date: { $gte: start23, $lte: end23 } });
    const count24 = await Showtime.countDocuments({ date: { $gte: start24, $lte: end24 } });

    console.log('Showtimes 23/5:', count23);
    console.log('Showtimes 24/5:', count24);

    const movies = await Movie.find({ status: 'now_showing' }, '_id title').lean();
    console.log('\nNow showing movies:', movies.length);

    let noShow23 = 0, noShow24 = 0;
    for (const m of movies) {
        const c23 = await Showtime.countDocuments({ movie: m._id, date: { $gte: start23, $lte: end23 } });
        const c24 = await Showtime.countDocuments({ movie: m._id, date: { $gte: start24, $lte: end24 } });
        const flag = (c23 === 0 ? ' [NO 23/5]' : '') + (c24 === 0 ? ' [NO 24/5]' : '');
        console.log(`  23/5:${c23}  24/5:${c24}  ${m.title}${flag}`);
        if (c23 === 0) noShow23++;
        if (c24 === 0) noShow24++;
    }

    console.log(`\nMovies with 0 showtimes on 23/5: ${noShow23}`);
    console.log(`Movies with 0 showtimes on 24/5: ${noShow24}`);

    // Also show cinemas and rooms available
    const Cinema = require('../models/Cinema');
    const CinemaRoom = require('../models/CinemaRoom');
    const cinemas = await Cinema.find({ status: 'active' }, '_id name').lean();
    console.log('\nActive cinemas:', cinemas.length);
    for (const c of cinemas) {
        const rooms = await CinemaRoom.countDocuments({ cinema: c._id, status: 'active' });
        console.log(`  ${c.name}: ${rooms} active rooms`);
    }

    await mongoose.disconnect();
}

run().catch(console.error);
