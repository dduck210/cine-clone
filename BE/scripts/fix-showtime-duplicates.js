require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const Showtime = require('../models/Showtime');
    const Seat = require('../models/Seat');
    const Booking = require('../models/Booking');

    // Find all duplicate groups (same cinema + date + startTime)
    const duplicates = await Showtime.aggregate([
        { $match: { status: 'active' } },
        {
            $group: {
                _id: { cinema: '$cinema', date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, startTime: '$startTime' },
                count: { $sum: 1 },
                ids: { $push: '$_id' },
            },
        },
        { $match: { count: { $gt: 1 } } },
    ]);

    console.log(`Found ${duplicates.length} duplicate groups.\n`);

    // Collect all IDs to delete (keep first of each group)
    const allToDelete = [];
    for (const dup of duplicates) {
        const [, ...toDelete] = dup.ids;
        allToDelete.push(...toDelete);
    }

    // Find which of those have paid bookings — must skip those
    const paidBookings = await Booking.find({
        showtime: { $in: allToDelete },
        status: 'paid',
    }).select('showtime bookingCode');

    const paidShowtimeIds = new Set(paidBookings.map(b => b.showtime.toString()));
    if (paidBookings.length > 0) {
        console.log(`⚠️  Skipping ${paidBookings.length} showtime(s) with paid bookings:`);
        paidBookings.forEach(b => console.log(`   Showtime ${b.showtime} — booking ${b.bookingCode}`));
        console.log();
    }

    const safeToDelete = allToDelete.filter(id => !paidShowtimeIds.has(id.toString()));
    console.log(`Deleting ${safeToDelete.length} duplicate showtimes (bulk)...`);

    // Bulk: cancel pending bookings, delete seats, delete showtimes
    await Booking.updateMany(
        { showtime: { $in: safeToDelete }, status: 'pending' },
        { status: 'cancelled' }
    );
    const seatResult = await Seat.deleteMany({ showtime: { $in: safeToDelete } });
    const stResult = await Showtime.deleteMany({ _id: { $in: safeToDelete } });

    console.log(`✅ Done.`);
    console.log(`   Showtimes deleted : ${stResult.deletedCount}`);
    console.log(`   Seats deleted     : ${seatResult.deletedCount}`);
    if (paidShowtimeIds.size > 0) console.log(`   Skipped (paid)   : ${paidShowtimeIds.size}`);

    await mongoose.disconnect();
}

main().catch(console.error);
