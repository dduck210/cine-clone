require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const NEW_EMAIL = process.argv[2];
if (!NEW_EMAIL) {
    console.error('Usage: node update-admin-email.js <new-email>');
    console.error('Example: node update-admin-email.js duonganhduc6a4@gmail.com');
    process.exit(1);
}

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('../models/User');
    const admin = await User.findOne({ email: 'admin@cinema.com' });
    if (!admin) {
        console.log('Không tìm thấy tài khoản admin@cinema.com');
        return;
    }
    admin.email = NEW_EMAIL;
    await admin.save();
    console.log(`✓ Đã cập nhật email admin: admin@cinema.com → ${NEW_EMAIL}`);
}

run().catch(console.error).finally(() => mongoose.disconnect());
