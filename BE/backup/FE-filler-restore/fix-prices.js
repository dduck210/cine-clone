const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Showtime = require('./models/Showtime');
const Seat = require('./models/Seat');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('MongoDB Connected');

    const showtimes = await Showtime.find({});
    for (const st of showtimes) {
        let newPrice;
        if (st.price <= 20)       newPrice = st.price * 10000;  // 12 → 120000đ
        else if (st.price < 1000) newPrice = st.price * 1000;
        else newPrice = st.price;

        await Showtime.updateOne({ _id: st._id }, { price: newPrice });
        await Seat.updateMany({ showtime: st._id }, { price: newPrice });
        console.log(`[OK] Showtime ${st.startTime}: ${st.price} → ${newPrice.toLocaleString()}đ`);
    }

    process.exit(0);
}).catch(e => { console.log('DB error:', e.message); process.exit(1); });
