const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Genre = require('./models/Genre');
const Movie = require('./models/Movie');
const Cinema = require('./models/Cinema');
const CinemaRoom = require('./models/CinemaRoom');
const Showtime = require('./models/Showtime');
const Seat = require('./models/Seat');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ Lỗi kết nối MongoDB:', error.message);
        process.exit(1);
    }
};

const seedDB = async () => {
    try {
        await connectDB();

        console.log('🗑️  Xóa dữ liệu cũ...');
        await Promise.all([
            Genre.deleteMany({}),
            Movie.deleteMany({}),
            Cinema.deleteMany({}),
            CinemaRoom.deleteMany({}),
            Showtime.deleteMany({}),
            Seat.deleteMany({}),
            User.deleteMany({}),
        ]);

        // ─── TẠO TÀI KHOẢN ─────────────────────────────────────────────
        console.log('👤 Tạo tài khoản...');
        const hashedAdmin = await bcrypt.hash('admin123', 10);
        const hashedUser = await bcrypt.hash('user123', 10);

        await User.insertMany([
            {
                name: 'Admin 5Cine',
                email: 'admin@5cine.vn',
                password: hashedAdmin,
                role: 'admin',
            },
            {
                name: 'Nguyễn Văn A',
                email: 'user@5cine.vn',
                password: hashedUser,
                role: 'user',
            },
        ]);
        console.log('  ✓ admin@5cine.vn (pass: admin123)  role: admin');
        console.log('  ✓ user@5cine.vn  (pass: user123)   role: user');

        // ─── THỂ LOẠI ───────────────────────────────────────────────────
        console.log('\n🎭 Tạo thể loại...');
        const genres = await Genre.insertMany([
            { name: 'Hành động' },
            { name: 'Hài hước' },
            { name: 'Tâm lý' },
            { name: 'Kinh dị' },
            { name: 'Lãng mạn' },
            { name: 'Khoa học viễn tưởng' },
            { name: 'Hoạt hình' },
            { name: 'Phiêu lưu' },
        ]);
        console.log(`  ✓ ${genres.length} thể loại`);

        const [action, comedy, drama, horror, romance, scifi, animation, adventure] = genres;

        // ─── PHIM ───────────────────────────────────────────────────────
        console.log('\n🎬 Tạo phim...');
        const movies = await Movie.insertMany([
            {
                title: 'Avengers: Endgame',
                genre: [action._id, scifi._id, adventure._id],
                duration: 181,
                poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
                trailer: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
                description: 'Sau sự kiện Thanos tiêu diệt một nửa vũ trụ, các Avengers còn lại phải tập hợp lần cuối để đảo ngược hành động của hắn và khôi phục trật tự cho vũ trụ.',
                rating: 8.4,
                status: 'now_showing',
                ageRestriction: 'T13',
            },
            {
                title: 'Người Nhện: Không Còn Nhà',
                genre: [action._id, scifi._id, adventure._id],
                duration: 148,
                poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
                trailer: 'https://www.youtube.com/watch?v=JfVOs4VSpmA',
                description: 'Peter Parker bị lộ danh tính và nhờ Doctor Strange dùng phép thuật để xóa ký ức của mọi người. Nhưng phép thuật bị sai và mở ra đa vũ trụ.',
                rating: 8.2,
                status: 'now_showing',
                ageRestriction: 'T13',
            },
            {
                title: 'Oppenheimer',
                genre: [drama._id, action._id],
                duration: 180,
                poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
                trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
                description: 'Câu chuyện về J. Robert Oppenheimer và vai trò của ông trong việc phát triển bom nguyên tử trong Thế chiến II.',
                rating: 8.5,
                status: 'now_showing',
                ageRestriction: 'T16',
            },
            {
                title: 'Barbie',
                genre: [comedy._id, romance._id],
                duration: 114,
                poster: 'https://image.tmdb.org/t/p/w500/iuFNMS8vlodTnuQs7q7tmOFHJF2.jpg',
                trailer: 'https://www.youtube.com/watch?v=8zIf0XvoL9Y',
                description: 'Barbie sống trong Barbieland hoàn hảo cho đến khi bị trục xuất vào thế giới thực. Cùng Ken, cô bắt đầu hành trình tự khám phá bản thân.',
                rating: 6.9,
                status: 'now_showing',
                ageRestriction: 'T13',
            },
            {
                title: 'The Dark Knight',
                genre: [action._id, drama._id],
                duration: 152,
                poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                trailer: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
                description: 'Batman đối mặt với kẻ phản diện hỗn loạn nhất từng xuất hiện — Joker — kẻ muốn đẩy Gotham City vào hỗn loạn.',
                rating: 9.0,
                status: 'now_showing',
                ageRestriction: 'T16',
            },
            {
                title: 'Cậu Bé Côn Đồ',
                genre: [comedy._id, drama._id],
                duration: 110,
                poster: 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg',
                trailer: 'https://www.youtube.com/watch?v=q3zqJs7JUCQ',
                description: 'Một cậu bé nghịch ngợm học cách trưởng thành qua những tình huống dở khóc dở cười trong cuộc sống hàng ngày.',
                rating: 7.2,
                status: 'now_showing',
                ageRestriction: 'P',
            },
            {
                title: 'Interstellar',
                genre: [scifi._id, drama._id, adventure._id],
                duration: 169,
                poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                trailer: 'https://www.youtube.com/watch?v=zSID6FbzZkE',
                description: 'Một nhóm phi hành gia du hành qua lỗ sâu đục không-thời gian để tìm kiếm hành tinh mới cho nhân loại.',
                rating: 8.7,
                status: 'coming_soon',
                ageRestriction: 'T13',
            },
            {
                title: 'Dune: Phần Hai',
                genre: [scifi._id, action._id, adventure._id],
                duration: 166,
                poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
                trailer: 'https://www.youtube.com/watch?v=Way9Dexny3w',
                description: 'Paul Atreides liên kết với Chani và người Fremen để trả thù những kẻ đã phá hủy gia đình mình.',
                rating: 8.5,
                status: 'coming_soon',
                ageRestriction: 'T13',
            },
        ]);
        console.log(`  ✓ ${movies.length} phim (${movies.filter(m => m.status === 'now_showing').length} đang chiếu, ${movies.filter(m => m.status === 'coming_soon').length} sắp chiếu)`);

        // ─── RẠP CHIẾU ──────────────────────────────────────────────────
        console.log('\n🏢 Tạo rạp chiếu...');
        const cinemas = await Cinema.insertMany([
            {
                name: '5Cine Royal City',
                location: 'Royal City',
                address: 'Tầng B1, TTTM Royal City, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội',
                phone: '024-3555-0001',
                email: 'royalcity@5cine.vn',
                city: 'Hà Nội',
                totalRooms: 0,
            },
            {
                name: '5Cine Times City',
                location: 'Times City',
                address: 'Tầng 3, TTTM Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội',
                phone: '024-3555-0002',
                email: 'timescity@5cine.vn',
                city: 'Hà Nội',
                totalRooms: 0,
            },
            {
                name: '5Cine Cầu Giấy',
                location: 'Cầu Giấy',
                address: 'Tầng 5, TTTM Indochina Plaza, 241 Xuân Thủy, Cầu Giấy, Hà Nội',
                phone: '024-3555-0003',
                email: 'caugiay@5cine.vn',
                city: 'Hà Nội',
                totalRooms: 0,
            },
        ]);
        console.log(`  ✓ ${cinemas.length} rạp`);

        // ─── PHÒNG CHIẾU ────────────────────────────────────────────────
        console.log('\n🎪 Tạo phòng chiếu...');
        const rooms = await CinemaRoom.insertMany([
            { cinema: cinemas[0]._id, name: 'Phòng 1', rows: 8, cols: 10, totalSeats: 80, roomType: 'standard' },
            { cinema: cinemas[0]._id, name: 'Phòng 2 (VIP)', rows: 6, cols: 8, totalSeats: 48, roomType: 'vip' },
            { cinema: cinemas[1]._id, name: 'Phòng 1', rows: 8, cols: 12, totalSeats: 96, roomType: 'standard' },
            { cinema: cinemas[1]._id, name: 'Phòng IMAX', rows: 10, cols: 14, totalSeats: 140, roomType: 'premium' },
            { cinema: cinemas[2]._id, name: 'Phòng 1', rows: 8, cols: 10, totalSeats: 80, roomType: 'standard' },
        ]);
        console.log(`  ✓ ${rooms.length} phòng chiếu`);

        // ─── LỊCH CHIẾU ─────────────────────────────────────────────────
        console.log('\n📅 Tạo lịch chiếu...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const makeDate = (daysFromNow) => {
            const d = new Date(today);
            d.setDate(d.getDate() + daysFromNow);
            return d;
        };

        const showtimeData = [
            // Avengers - Royal City
            { movie: movies[0]._id, cinema: cinemas[0]._id, room: rooms[0]._id, date: makeDate(0), startTime: '10:00', endTime: '13:01', price: 120000, totalSeats: 80, availableSeats: 80 },
            { movie: movies[0]._id, cinema: cinemas[0]._id, room: rooms[0]._id, date: makeDate(0), startTime: '14:00', endTime: '17:01', price: 120000, totalSeats: 80, availableSeats: 80 },
            { movie: movies[0]._id, cinema: cinemas[0]._id, room: rooms[1]._id, date: makeDate(0), startTime: '20:00', endTime: '23:01', price: 180000, totalSeats: 48, availableSeats: 48 },
            // Avengers - Times City
            { movie: movies[0]._id, cinema: cinemas[1]._id, room: rooms[2]._id, date: makeDate(0), startTime: '09:30', endTime: '12:31', price: 120000, totalSeats: 96, availableSeats: 96 },
            { movie: movies[0]._id, cinema: cinemas[1]._id, room: rooms[3]._id, date: makeDate(0), startTime: '19:30', endTime: '22:31', price: 150000, totalSeats: 140, availableSeats: 140 },
            // Spider-Man - Royal City
            { movie: movies[1]._id, cinema: cinemas[0]._id, room: rooms[0]._id, date: makeDate(0), startTime: '11:00', endTime: '13:28', price: 120000, totalSeats: 80, availableSeats: 80 },
            { movie: movies[1]._id, cinema: cinemas[0]._id, room: rooms[0]._id, date: makeDate(1), startTime: '15:00', endTime: '17:28', price: 120000, totalSeats: 80, availableSeats: 80 },
            // Spider-Man - Cầu Giấy
            { movie: movies[1]._id, cinema: cinemas[2]._id, room: rooms[4]._id, date: makeDate(0), startTime: '18:00', endTime: '20:28', price: 120000, totalSeats: 80, availableSeats: 80 },
            // Oppenheimer - Times City IMAX
            { movie: movies[2]._id, cinema: cinemas[1]._id, room: rooms[3]._id, date: makeDate(0), startTime: '17:00', endTime: '20:00', price: 200000, totalSeats: 140, availableSeats: 140 },
            { movie: movies[2]._id, cinema: cinemas[1]._id, room: rooms[3]._id, date: makeDate(1), startTime: '20:00', endTime: '23:00', price: 200000, totalSeats: 140, availableSeats: 140 },
            // Barbie - Cầu Giấy
            { movie: movies[3]._id, cinema: cinemas[2]._id, room: rooms[4]._id, date: makeDate(0), startTime: '10:30', endTime: '12:24', price: 110000, totalSeats: 80, availableSeats: 80 },
            { movie: movies[3]._id, cinema: cinemas[2]._id, room: rooms[4]._id, date: makeDate(1), startTime: '14:30', endTime: '16:24', price: 110000, totalSeats: 80, availableSeats: 80 },
            // The Dark Knight - Royal City VIP
            { movie: movies[4]._id, cinema: cinemas[0]._id, room: rooms[1]._id, date: makeDate(0), startTime: '16:00', endTime: '18:32', price: 180000, totalSeats: 48, availableSeats: 48 },
            { movie: movies[4]._id, cinema: cinemas[0]._id, room: rooms[1]._id, date: makeDate(1), startTime: '21:00', endTime: '23:32', price: 180000, totalSeats: 48, availableSeats: 48 },
            // Cậu Bé Côn Đồ - Cầu Giấy
            { movie: movies[5]._id, cinema: cinemas[2]._id, room: rooms[4]._id, date: makeDate(0), startTime: '08:30', endTime: '10:20', price: 100000, totalSeats: 80, availableSeats: 80 },
        ];

        const createdShowtimes = await Showtime.insertMany(showtimeData);
        console.log(`  ✓ ${createdShowtimes.length} suất chiếu`);

        // ─── GHẾ ────────────────────────────────────────────────────────
        console.log('\n💺 Tạo ghế cho từng suất chiếu...');
        let totalSeats = 0;
        for (const showtime of createdShowtimes) {
            const room = await CinemaRoom.findById(showtime.room);
            const seats = [];
            for (let i = 0; i < room.rows; i++) {
                const row = String.fromCharCode(65 + i);
                for (let j = 1; j <= room.cols; j++) {
                    seats.push({
                        showtime: showtime._id,
                        room: showtime.room,
                        row,
                        col: j,
                        seatNumber: `${row}${j}`,
                        status: 'available',
                        price: showtime.price,
                    });
                }
            }
            await Seat.insertMany(seats);
            totalSeats += seats.length;
        }
        console.log(`  ✓ ${totalSeats} ghế`);

        console.log('\n🎉 Seed database hoàn tất!');
        console.log('─'.repeat(50));
        console.log('Tài khoản admin:  admin@5cine.vn  /  admin123');
        console.log('Tài khoản user:   user@5cine.vn   /  user123');
        console.log('─'.repeat(50));
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi seed:', error.message);
        process.exit(1);
    }
};

seedDB();
