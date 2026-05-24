require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    const Showtime = require('../models/Showtime');
    const Seat = require('../models/Seat');
    const Booking = require('../models/Booking');

    // These are the duplicate [0] entries (no paid booking) to delete
    const ids = [
        '6a115c5ed165532ee26b00e5',
        '6a115c5ed165532ee26b01a8',
        '6a115c5ed165532ee26b0155',
    ];

    await Booking.updateMany({ showtime: { $in: ids }, status: 'pending' }, { status: 'cancelled' });
    const s = await Seat.deleteMany({ showtime: { $in: ids } });
    const st = await Showtime.deleteMany({ _id: { $in: ids } });

    console.log(`Deleted showtimes: ${st.deletedCount} | seats: ${s.deletedCount}`);
    await mongoose.disconnect();
}

main().catch(console.error);
