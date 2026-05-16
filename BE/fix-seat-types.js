require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const CinemaRoom = require('./models/CinemaRoom');
const Showtime = require('./models/Showtime');
const Seat = require('./models/Seat');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('MongoDB Connected');

    // Find all rooms with 6+ rows that have NO seatMatrix configured
    const rooms = await CinemaRoom.find({ rows: { $gte: 6 } });
    let totalFixed = 0;

    for (const room of rooms) {
        // Skip rooms that already have seatMatrix — their seats were created correctly from matrix
        if (room.seatMatrix && room.seatMatrix.length > 0) {
            console.log(`Room ${room.name}: has seatMatrix, skipping`);
            continue;
        }

        const lastRowLetter       = String.fromCharCode(65 + room.rows - 1); // couple row
        const secondLastRowLetter = String.fromCharCode(65 + room.rows - 2); // vip row

        // Get all showtimes for this room so we can use correct priceConfig
        const showtimes = await Showtime.find({ room: room._id });

        for (const showtime of showtimes) {
            const pc = showtime.priceConfig || {};

            // Fix VIP row
            const vipResult = await Seat.updateMany(
                { showtime: showtime._id, room: room._id, row: secondLastRowLetter, type: 'normal' },
                { $set: { type: 'vip', price: pc.vip || pc.normal || 0 } }
            );

            // Fix couple row
            const coupleResult = await Seat.updateMany(
                { showtime: showtime._id, room: room._id, row: lastRowLetter, type: { $in: ['normal', 'vip'] } },
                { $set: { type: 'couple', price: pc.couple || pc.normal || 0 } }
            );

            const fixed = vipResult.modifiedCount + coupleResult.modifiedCount;
            if (fixed > 0) {
                console.log(`  Room ${room.name} / showtime ${showtime._id}: fixed ${vipResult.modifiedCount} VIP + ${coupleResult.modifiedCount} couple`);
                totalFixed += fixed;
            }
        }
    }

    console.log(`\nDone. Total seats fixed: ${totalFixed}`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
