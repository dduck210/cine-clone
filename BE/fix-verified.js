require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const result = await User.updateMany(
        { isVerified: { $ne: true } },
        { $set: { isVerified: true } }
    );
    console.log('[OK] Updated', result.modifiedCount, 'account(s) → isVerified: true');
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
