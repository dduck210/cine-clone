require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Cinema = require('../models/Cinema');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const result = await Cinema.updateMany({ status: 'incident' }, { $set: { status: 'active' } });
    console.log('Đã kích hoạt lại:', result.modifiedCount, 'rạp');
    const cinemas = await Cinema.find({}, 'name status').lean();
    cinemas.forEach(c => console.log(c.name, '->', c.status));
    await mongoose.disconnect();
});
