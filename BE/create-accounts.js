const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const User = require('./models/User');

const accounts = [
    { name: 'Admin', email: 'admin@cinema.com', password: '123456', role: 'admin' },
    { name: 'Nguyen Van A', email: 'user@cinema.com', password: '123456', role: 'user' },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('MongoDB Connected');
    for (const acc of accounts) {
        try {
            const existing = await User.findOne({ email: acc.email });
            if (existing) {
                console.log(`[SKIP] ${acc.email} đã tồn tại`);
                continue;
            }
            const user = new User(acc);
            await user.save();
            console.log(`[OK] Tạo ${acc.role}: ${acc.email} / ${acc.password}`);
        } catch (e) {
            console.log(`[ERR] ${acc.email}:`, e.message);
        }
    }
    process.exit(0);
}).catch(e => {
    console.log('DB error:', e.message);
    process.exit(1);
});
