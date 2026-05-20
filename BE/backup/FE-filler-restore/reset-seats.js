const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Seat = require('./models/Seat');
const Booking = require('./models/Booking');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('MongoDB Connected');

    // Xóa các booking pending bị kẹt
    const deleted = await Booking.deleteMany({ status: 'pending' });
    console.log(`Deleted ${deleted.deletedCount} pending bookings`);

    // Reset ghế reserved về available
    const updated = await Seat.updateMany({ status: 'reserved' }, { status: 'available' });
    console.log(`Reset ${updated.modifiedCount} reserved seats → available`);

    process.exit(0);
}).catch(e => { console.log('DB error:', e.message); process.exit(1); });
