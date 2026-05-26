require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('../models/CinemaRoom');
require('../models/Cinema');
require('../models/Movie');
const Showtime = require('../models/Showtime');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const today = new Date('2026-05-27');
    const dayStart = new Date(today); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(today); dayEnd.setUTCHours(23, 59, 59, 999);
    const result = await Showtime.updateMany(
        { date: { $gte: dayStart, $lte: dayEnd }, status: 'active', startTime: { $lt: '08:00' } },
        { $set: { status: 'cancelled' } }
    );
    console.log('Cancelled:', result.modifiedCount, 'early morning test showtimes');
    mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
