require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');
const Showtime = require('./models/Showtime');
const Seat = require('./models/Seat');
const { calcPriceConfig } = require('./utils/pricing');

// Giá base hợp lý cho The Avengers (đổi nếu muốn)
const TARGET_BASE_PRICE = 85000;

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('MongoDB Connected\n');

    const movie = await Movie.findOne({ title: /avengers/i });
    if (!movie) { console.log('Không tìm thấy phim The Avengers'); process.exit(1); }
    console.log(`Phim: ${movie.title} (${movie._id})\n`);

    const showtimes = await Showtime.find({ movie: movie._id });
    console.log(`Tìm thấy ${showtimes.length} suất chiếu\n`);

    let fixed = 0;
    for (const st of showtimes) {
        const oldPrice = st.basePrice;
        if (oldPrice <= 200000) {
            console.log(`[SKIP] ${st.startTime} ${new Date(st.date).toLocaleDateString('vi-VN')} — basePrice ${oldPrice.toLocaleString()}đ (bình thường)`);
            continue;
        }

        const newPriceConfig = calcPriceConfig(TARGET_BASE_PRICE, st.timeSlot, st.dayType);

        await Showtime.updateOne({ _id: st._id }, {
            basePrice: TARGET_BASE_PRICE,
            priceConfig: newPriceConfig,
        });

        // Cập nhật giá từng ghế
        await Seat.updateMany({ showtime: st._id, type: 'normal' },  { price: newPriceConfig.normal });
        await Seat.updateMany({ showtime: st._id, type: 'vip' },     { price: newPriceConfig.vip });
        await Seat.updateMany({ showtime: st._id, type: 'couple' },  { price: newPriceConfig.couple });

        console.log(`[FIX] ${st.startTime} ${new Date(st.date).toLocaleDateString('vi-VN')} — ${oldPrice.toLocaleString()}đ → normal: ${newPriceConfig.normal.toLocaleString()}đ | vip: ${newPriceConfig.vip.toLocaleString()}đ | couple: ${newPriceConfig.couple.toLocaleString()}đ`);
        fixed++;
    }

    console.log(`\nĐã sửa ${fixed}/${showtimes.length} suất chiếu.`);
    process.exit(0);
}).catch(e => { console.error('DB error:', e.message); process.exit(1); });
