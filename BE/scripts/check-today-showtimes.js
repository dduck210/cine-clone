require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
require('../models/CinemaRoom');
require('../models/Cinema');
require('../models/Movie');
const Showtime = require('../models/Showtime');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const dayStart = new Date('2026-05-27'); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date('2026-05-27'); dayEnd.setUTCHours(23, 59, 59, 999);
    const list = await Showtime.find({ date: { $gte: dayStart, $lte: dayEnd }, status: 'active' })
        .populate('room', 'name')
        .populate('cinema', 'name')
        .select('startTime endTime room cinema')
        .sort('startTime')
        .lean();
    console.log('Total active today:', list.length);
    list.forEach(s => console.log(` ${s.startTime} -> ${s.endTime} | ${s.cinema?.name?.slice(0, 25)} | ${s.room?.name}`));
    mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
