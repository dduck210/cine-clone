require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Movie = require('../models/Movie');
const Review = require('../models/Review');

// ── 20 seed users ─────────────────────────────────────────────────────────────
const SEED_USERS = [
    { name: 'Nguyễn Minh Tuấn',   email: 'minhtuannguyen.5c@gmail.com' },
    { name: 'Trần Thị Hương',     email: 'thuongtran.5c@gmail.com' },
    { name: 'Lê Văn Phúc',        email: 'vanphucle.5c@gmail.com' },
    { name: 'Phạm Thùy Linh',     email: 'thuylinhpham.5c@gmail.com' },
    { name: 'Hoàng Đức Anh',      email: 'ducanh.5c@gmail.com' },
    { name: 'Võ Thị Thanh',       email: 'thanhvo.5c@gmail.com' },
    { name: 'Đặng Quốc Huy',      email: 'quochuy.5c@gmail.com' },
    { name: 'Bùi Ngọc Mai',       email: 'ngocmai.5c@gmail.com' },
    { name: 'Ngô Thị Kim Chi',    email: 'kimchi.5c@gmail.com' },
    { name: 'Dương Văn Tùng',     email: 'vantung.5c@gmail.com' },
    { name: 'Lý Thị Bích Ngọc',  email: 'bichngoc.5c@gmail.com' },
    { name: 'Trịnh Đình Khải',    email: 'dinhkhai.5c@gmail.com' },
    { name: 'Phan Thị Lan',       email: 'thilan.5c@gmail.com' },
    { name: 'Vũ Hồng Sơn',        email: 'hongson.5c@gmail.com' },
    { name: 'Mai Thị Thu Hà',     email: 'thuha.5c@gmail.com' },
    { name: 'Cao Thanh Bình',     email: 'thanhbinh.5c@gmail.com' },
    { name: 'Đinh Thị Yến',       email: 'thiyenn.5c@gmail.com' },
    { name: 'Lưu Quang Vinh',     email: 'quangvinh.5c@gmail.com' },
    { name: 'Hồ Thị Diệu Linh',  email: 'dieulinh.5c@gmail.com' },
    { name: 'Tạ Quốc Bảo',       email: 'quocbao.5c@gmail.com' },
];

// ── Comment pool by rating ────────────────────────────────────────────────────
const COMMENTS = {
    5: [
        'Phim hay tuyệt vời! Cốt truyện hấp dẫn từ đầu đến cuối, diễn xuất xuất sắc.',
        'Một trong những bộ phim hay nhất tôi từng xem. Hoàn toàn xứng đáng 5 sao!',
        'Hình ảnh đẹp mãn nhãn, âm nhạc tuyệt vời, nội dung sâu sắc. Rất đáng xem!',
        'Phim cuốn hút không rời mắt được. Diễn viên diễn xuất rất tự nhiên và cảm xúc.',
        'Xuất sắc! Kịch bản chặt chẽ, những pha hành động mãn nhãn và cái kết thỏa mãn.',
        'Tôi đã xem đi xem lại 2 lần rồi. Phim quá hay, không thể bỏ qua!',
        'Đây là kiệt tác điện ảnh! Mỗi khung hình đều được dàn dựng công phu và tinh tế.',
        'Phim làm tôi vừa cười vừa khóc. Cảm xúc trào dâng từng giây từng phút.',
    ],
    4: [
        'Phim rất hay, cốt truyện cuốn hút và diễn xuất tốt. Chỉ thiếu một chút gì đó ở phần cuối.',
        'Nhìn chung phim rất tốt, hình ảnh đẹp và nội dung thú vị. Đáng để ra rạp xem.',
        'Phim hay, diễn viên diễn tốt. Có vài cảnh hơi dài nhưng tổng thể rất ổn.',
        'Khá thỏa mãn khi xem xong. Phim có nhiều điểm sáng tạo và bất ngờ.',
        'Nội dung hay, hiệu ứng hình ảnh ấn tượng. Xứng đáng được nhiều người xem hơn.',
        'Phim tốt hơn tôi mong đợi. Cốt truyện logic và nhân vật được xây dựng chắc chắn.',
        'Rất thích phim này, chỉ tiếc phần nhạc nền chưa thực sự nổi bật. Nhưng vẫn rất đáng xem.',
        'Phim hay, thông điệp ý nghĩa. Tôi sẽ giới thiệu cho bạn bè cùng xem.',
    ],
    3: [
        'Phim ở mức trung bình, không quá hay nhưng cũng không dở. Xem cho vui cuối tuần.',
        'Cốt truyện khá đơn giản, diễn xuất ổn. Không có gì đặc sắc nhưng cũng không tệ.',
        'Phim được, không đến nỗi lãng phí tiền mua vé. Hình ảnh đẹp nhưng nội dung bình thường.',
        'Tôi kỳ vọng nhiều hơn nhưng phim khá ổn, phù hợp để thư giãn cuối tuần.',
        'Xem tạm được, không quá ấn tượng. Nếu bạn thích thể loại này thì có thể xem.',
        'Phim trung bình, một số cảnh hay nhưng tổng thể chưa đủ hấp dẫn.',
    ],
    2: [
        'Phim hơi thất vọng, nội dung loãng và kéo dài không cần thiết ở nhiều đoạn.',
        'Diễn xuất chưa thuyết phục, cốt truyện có nhiều lỗ hổng logic. Chưa đáng tiền vé.',
        'Tôi thấy phim chưa tốt lắm, nhân vật thiếu chiều sâu và cốt truyện khá nhàm.',
        'Phim có ý tưởng hay nhưng thực hiện chưa tốt. Nhiều cảnh không cần thiết làm phim mất nhịp.',
    ],
};

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickRating(movieIndex) {
    // Weighted: mostly 4-5 stars, occasional 3, rare 2
    const weights = [0, 0, 5, 20, 40, 35]; // index = rating (0-5)
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return 4;
}

function pickComment(rating) {
    const pool = COMMENTS[rating] || COMMENTS[3];
    return pool[Math.floor(Math.random() * pool.length)];
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Delete ALL existing reviews
    const deleted = await Review.deleteMany({});
    console.log(`Deleted ${deleted.deletedCount} existing reviews`);

    // 2. Delete old seed users (emails ending with .5c@gmail.com or old seed emails)
    const oldSeedEmails = [
        ...SEED_USERS.map(u => u.email),
        // old seed emails from previous script
        'minhtuannguyen@gmail.com', 'thuongtran.cine@gmail.com', 'vanphucle@gmail.com',
        'thuylinhpham@gmail.com', 'ducanh.hoang@gmail.com', 'thanhvo.review@gmail.com',
        'quochuy.dang@gmail.com', 'ngocmai.bui@gmail.com', 'kimchi.ngo@gmail.com',
        'vantung.duong@gmail.com', 'bichngoc.ly@gmail.com', 'dinhkhai.trinh@gmail.com',
        'thilan.phan@gmail.com', 'hongson.vu@gmail.com', 'thuha.mai@gmail.com',
    ];
    const removedUsers = await User.deleteMany({ email: { $in: oldSeedEmails } });
    console.log(`Removed ${removedUsers.deletedCount} old seed users`);

    // 3. Create 20 new seed users
    const hashedPassword = await bcrypt.hash('Seed@123456', 10);
    const createdUsers = [];
    for (const u of SEED_USERS) {
        const user = await User.create({
            name: u.name,
            email: u.email,
            password: hashedPassword,
            isVerified: true,
            role: 'user',
        });
        createdUsers.push(user);
    }
    console.log(`Created ${createdUsers.length} seed users`);

    // 4. Seed reviews for all movies
    const movies = await Movie.find({});
    console.log(`Found ${movies.length} movies to review`);

    let totalReviews = 0;
    for (let mi = 0; mi < movies.length; mi++) {
        const movie = movies[mi];
        // Each movie gets 10-20 reviews (shuffled subset of users)
        const count = Math.min(createdUsers.length, 10 + Math.floor(Math.random() * 11));
        const reviewers = shuffle(createdUsers).slice(0, count);

        for (const user of reviewers) {
            const rating = pickRating(mi);
            await Review.create({
                user: user._id,
                movie: movie._id,
                rating,
                comment: pickComment(rating),
            });
            totalReviews++;
        }
        console.log(`  "${movie.title}" — ${reviewers.length} reviews`);
    }

    console.log(`\nDone! Created ${totalReviews} reviews across ${movies.length} movies.`);
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
