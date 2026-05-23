require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Genre = require('./models/Genre');
const Movie = require('./models/Movie');
const Cinema = require('./models/Cinema');
const CinemaRoom = require('./models/CinemaRoom');
const Showtime = require('./models/Showtime');
const Seat = require('./models/Seat');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const { getTimeSlot, getDayTypeFromDate, calcEndTime, calcPriceConfig } = require('./utils/pricing');

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

const seedDB = async () => {
    try {
        await connectDB();

        const force = process.argv.includes('--force');
        const existingCount = await Movie.countDocuments();
        if (existingCount > 0 && !force) {
            console.log(`DB đã có ${existingCount} phim. Bỏ qua seed.`);
            console.log('Chạy "node seed.js --force" nếu muốn xóa sạch và seed lại.');
            process.exit(0);
        }

        // Clear existing data
        await Payment.deleteMany({});
        await Booking.deleteMany({});
        await Seat.deleteMany({});
        await Showtime.deleteMany({});
        await CinemaRoom.deleteMany({});
        await Cinema.deleteMany({});
        await Movie.deleteMany({});
        await Genre.deleteMany({});

        // Create genres
        const genres = [
            { name: 'Action', description: 'Action movies with fights and explosions' },
            { name: 'Comedy', description: 'Funny and hilarious movies' },
            { name: 'Drama', description: 'Emotional and serious movies' },
            { name: 'Horror', description: 'Scary and frightening movies' },
            { name: 'Romance', description: 'Love stories and romantic movies' },
            { name: 'Sci-Fi', description: 'Science fiction movies' },
        ];

        const createdGenres = await Genre.insertMany(genres);
        console.log(`Created ${createdGenres.length} genres`);

        // Create movies
        const movies = [
            {
                title: 'The Avengers',
                genre: [createdGenres[0]._id],
                duration: 143,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/rX46P5ZwcHOvrkhtYDYhnNf46Bo.jpg',
                trailer: 'https://www.youtube.com/watch?v=eOviiWA-_yc',
                description: 'Earth\'s mightiest heroes must come together to prevent an alien invasion.',
                rating: 4.0,
                status: 'now_showing',
                ageRestriction: '13+',
            },
            {
                title: 'Superbad',
                genre: [createdGenres[1]._id],
                duration: 113,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg',
                trailer: 'https://www.youtube.com/watch?v=H9H0ujS28xo',
                description: 'Two misfit friends try to navigate high school and get girls.',
                rating: 3.8,
                status: 'now_showing',
                ageRestriction: '15+',
            },
            {
                title: 'The Shawshank Redemption',
                genre: [createdGenres[2]._id],
                duration: 142,
                poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
                trailer: 'https://www.youtube.com/watch?v=6hB3S9bIaco',
                description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption.',
                rating: 4.7,
                status: 'now_showing',
                ageRestriction: '15+',
            },
            {
                title: 'The Ring',
                genre: [createdGenres[3]._id],
                duration: 115,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/is0Y28s3Gs8ae3vTkx9CJSVQdaw.jpg',
                trailer: 'https://www.youtube.com/watch?v=HQuC_yW_8aE',
                description: 'A woman must deal with a mysterious videotape that kills anyone who watches it.',
                rating: 3.6,
                status: 'now_showing',
                ageRestriction: '18+',
            },
            {
                title: 'The Notebook',
                genre: [createdGenres[4]._id],
                duration: 123,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/jSM8ufnkCpdf5sVHu9ESFQDowRF.jpg',
                trailer: 'https://www.youtube.com/watch?v=FCWyj-zt3r8',
                description: 'A poor man falls in love with a rich girl but they are separated due to class differences.',
                rating: 3.9,
                status: 'now_showing',
                ageRestriction: 'All ages',
            },
            {
                title: 'Interstellar',
                genre: [createdGenres[5]._id, createdGenres[2]._id],
                duration: 169,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/if4TI9LbqNIrzkoOgWjX5PZYDYe.jpg',
                trailer: 'https://www.youtube.com/watch?v=zSID6FbzZkE',
                description: 'A team of astronauts must travel through a wormhole to save humanity.',
                rating: 4.3,
                status: 'coming_soon',
                ageRestriction: 'All ages',
            },
            // ── 2 phim đang chiếu: Conan, Dragon Ball ──
            {
                title: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô',
                genre: [createdGenres[0]._id, createdGenres[2]._id],
                duration: 110,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/AlSEw3akrBZRK9w68gcFQpHHpy3.jpg',
                trailer: 'https://www.youtube.com/watch?v=3tI1py2FkH8',
                description: 'Conan và nhóm bạn phải giải mã bí ẩn đằng sau viên ngọc 5 cánh trị giá triệu đô tại Hakodate.',
                rating: 4.1,
                status: 'now_showing',
                ageRestriction: 'All ages',
            },
            {
                title: 'Dragon Ball Super: Broly',
                genre: [createdGenres[0]._id, createdGenres[5]._id],
                duration: 100,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/6iO8TJCyLI4BiPYOvdwzPV2bhoV.jpg',
                trailer: 'https://www.youtube.com/watch?v=FHgm89hGlLE',
                description: 'Goku và Vegeta đối mặt với một chiến binh Saiyan huyền thoại mang tên Broly trong trận chiến sinh tử.',
                rating: 4.3,
                status: 'now_showing',
                ageRestriction: 'All ages',
            },
            // ── 3 phim hot đang chiếu ──
            {
                title: 'Doraemon: Nobita và Bản Giao Hưởng Địa Cầu',
                genre: [createdGenres[1]._id, createdGenres[5]._id],
                duration: 115,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/wovo2VvBVDI39S0y6sGenuJ03vd.jpg',
                trailer: 'https://www.youtube.com/watch?v=Lm8JYI7QXSE',
                description: 'Nobita và Doraemon du hành đến một thế giới âm nhạc kỳ diệu để cứu Trái Đất khỏi thảm họa.',
                rating: 4.0,
                status: 'now_showing',
                ageRestriction: 'All ages',
            },
            {
                title: 'Lật Mặt 8: Vòng Tay Nắng',
                genre: [createdGenres[2]._id, createdGenres[1]._id],
                duration: 128,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/5MRo3arvulO98v27OPO5DXA7UDy.jpg',
                trailer: 'https://www.youtube.com/watch?v=tW4LN5NGjCk',
                description: 'Hành trình theo đuổi đam mê âm nhạc của một nhóm bạn trẻ giữa những thử thách cuộc sống.',
                rating: 3.9,
                status: 'now_showing',
                ageRestriction: 'All ages',
            },
            {
                title: 'Mai',
                genre: [createdGenres[2]._id, createdGenres[4]._id],
                duration: 130,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/2nF8xD200rcDawuCg5ObxxqA2fC.jpg',
                trailer: 'https://www.youtube.com/watch?v=5U8k0Eza5CI',
                description: 'Câu chuyện về Mai, một người phụ nữ bí ẩn với quá khứ phức tạp, và những mối quan hệ đan xen trong cuộc sống hiện đại.',
                rating: 4.1,
                status: 'now_showing',
                ageRestriction: '15+',
            },
            // ── 3 phim sắp chiếu ──
            {
                title: 'Avatar 3: Fire and Ash',
                genre: [createdGenres[0]._id, createdGenres[5]._id, createdGenres[2]._id],
                duration: 192,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/w6DBmG260sCHBQdGzkBIVn9gAQZ.jpg',
                trailer: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
                description: 'Jake Sully và Neytiri khám phá những vùng đất mới của Pandora và đối mặt với tộc người lửa hung hãn.',
                rating: 0,
                status: 'coming_soon',
                ageRestriction: '13+',
            },
            {
                title: 'Spider-Man: Beyond the Spider-Verse',
                genre: [createdGenres[0]._id, createdGenres[5]._id],
                duration: 140,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/9PIhQqqI6Q4a5YjwMjxvzZcPJhf.jpg',
                trailer: 'https://www.youtube.com/watch?v=shW9i6k8cB0',
                description: 'Miles Morales tiếp tục cuộc phiêu lưu xuyên đa vũ trụ để cứu những người mình yêu thương.',
                rating: 0,
                status: 'coming_soon',
                ageRestriction: 'All ages',
            },
            {
                title: 'The Batman 2',
                genre: [createdGenres[0]._id, createdGenres[2]._id],
                duration: 155,
                poster: 'https://media.themoviedb.org/t/p/w300_and_h450_face/5X1n5q08mZ7NpNpxehMFODxfNYq.jpg',
                trailer: 'https://www.youtube.com/watch?v=NLOp_6uPccQ',
                description: 'Batman đối mặt với những mối đe dọa mới tại Gotham khi quá khứ đen tối của thành phố dần được hé lộ.',
                rating: 0,
                status: 'coming_soon',
                ageRestriction: '15+',
            },
        ];

        const createdMovies = await Movie.insertMany(movies);
        console.log(`Created ${createdMovies.length} movies`);

        // Create cinemas
        const cinemas = [
            {
                name: 'Megaplex Cinema',
                location: 'Downtown',
                address: '123 Main Street',
                phone: '555-0001',
                email: 'megaplex@cinema.com',
                city: 'New York',
                totalRooms: 0,
            },
            {
                name: 'Cineplex Premium',
                location: 'Mall Center',
                address: '456 Park Avenue',
                phone: '555-0002',
                email: 'cineplex@cinema.com',
                city: 'Los Angeles',
                totalRooms: 0,
            },
        ];

        const createdCinemas = await Cinema.insertMany(cinemas);
        console.log(`Created ${createdCinemas.length} cinemas`);

        // Create rooms for cinemas
        const rooms = [
            {
                cinema: createdCinemas[0]._id,
                name: 'Room A',
                rows: 8,
                cols: 10,
                totalSeats: 80,
                roomType: 'Standard',
            },
            {
                cinema: createdCinemas[0]._id,
                name: 'Room B (VIP)',
                rows: 6,
                cols: 8,
                totalSeats: 48,
                roomType: 'VIP',
            },
            {
                cinema: createdCinemas[1]._id,
                name: 'Room A',
                rows: 10,
                cols: 12,
                totalSeats: 120,
                roomType: 'Premium',
            },
        ];

        const createdRooms = await CinemaRoom.insertMany(rooms);
        console.log(`Created ${createdRooms.length} rooms`);

        // Create showtimes spread across next 7 days
        const daysFromNow = (n) => {
            const d = new Date();
            d.setDate(d.getDate() + n);
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const showtimeData = [
            // Now showing movies
            { movie: createdMovies[0]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(1), startTime: '10:00', basePrice: 80000, totalSeats: 80 },
            { movie: createdMovies[0]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(1), startTime: '14:00', basePrice: 80000, totalSeats: 80 },
            { movie: createdMovies[0]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(2), startTime: '19:00', basePrice: 85000, totalSeats: 120 },
            { movie: createdMovies[1]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(2), startTime: '18:00', basePrice: 90000, totalSeats: 120 },
            { movie: createdMovies[2]._id, cinema: createdCinemas[0]._id, room: createdRooms[1]._id, date: daysFromNow(3), startTime: '20:00', basePrice: 100000, totalSeats: 48 },
            { movie: createdMovies[3]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(4), startTime: '09:00', basePrice: 75000, totalSeats: 120 },
            { movie: createdMovies[4]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(5), startTime: '19:30', basePrice: 85000, totalSeats: 80 },
            { movie: createdMovies[5]._id, cinema: createdCinemas[0]._id, room: createdRooms[1]._id, date: daysFromNow(6), startTime: '15:00', basePrice: 110000, totalSeats: 48 },
            { movie: createdMovies[2]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(7), startTime: '11:00', basePrice: 90000, totalSeats: 120 },
            // Conan
            { movie: createdMovies[6]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(1), startTime: '17:30', basePrice: 85000, totalSeats: 80 },
            { movie: createdMovies[6]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(3), startTime: '14:00', basePrice: 90000, totalSeats: 120 },
            // Dragon Ball
            { movie: createdMovies[7]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(2), startTime: '10:30', basePrice: 85000, totalSeats: 80 },
            { movie: createdMovies[7]._id, cinema: createdCinemas[0]._id, room: createdRooms[1]._id, date: daysFromNow(4), startTime: '19:00', basePrice: 100000, totalSeats: 48 },
            // Doraemon (hot)
            { movie: createdMovies[8]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(1), startTime: '09:30', basePrice: 80000, totalSeats: 120 },
            { movie: createdMovies[8]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(5), startTime: '16:00', basePrice: 80000, totalSeats: 80 },
            // Lật Mặt 8 (hot)
            { movie: createdMovies[9]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(2), startTime: '20:30', basePrice: 90000, totalSeats: 120 },
            { movie: createdMovies[9]._id, cinema: createdCinemas[0]._id, room: createdRooms[1]._id, date: daysFromNow(6), startTime: '18:00', basePrice: 100000, totalSeats: 48 },
            // Mai (hot)
            { movie: createdMovies[10]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(3), startTime: '20:00', basePrice: 85000, totalSeats: 80 },
            { movie: createdMovies[10]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(5), startTime: '13:00', basePrice: 90000, totalSeats: 120 },
        ];

        const showtimes = showtimeData.map(({ totalSeats, ...st }) => {
            const timeSlot = getTimeSlot(st.startTime);
            const dayType = getDayTypeFromDate(st.date);
            const movie = createdMovies.find(m => m._id.equals(st.movie));
            const endTime = calcEndTime(st.startTime, movie.duration);
            const priceConfig = calcPriceConfig(st.basePrice, timeSlot, dayType);
            return { ...st, timeSlot, dayType, endTime, priceConfig, totalSeats, availableSeats: totalSeats, status: 'active' };
        });

        const createdShowtimes = await Showtime.insertMany(showtimes);
        console.log(`Created ${createdShowtimes.length} showtimes`);

        // Create seats for each showtime
        for (const showtime of createdShowtimes) {
            const room = await CinemaRoom.findById(showtime.room);
            const seats = [];
            for (let i = 0; i < room.rows; i++) {
                const row = String.fromCharCode(65 + i);
                // Last 2 rows = VIP, last row = couple for rooms with 6+ rows
                const isVip = room.rows >= 6 && i >= room.rows - 2;
                const isCouple = room.rows >= 6 && i === room.rows - 1;
                const seatType = isCouple ? 'couple' : isVip ? 'vip' : 'normal';
                const seatPrice = showtime.priceConfig[seatType];
                for (let j = 1; j <= room.cols; j++) {
                    seats.push({
                        showtime: showtime._id,
                        room: showtime.room,
                        row,
                        col: j,
                        seatNumber: `${row}${j}`,
                        type: seatType,
                        status: 'available',
                        price: seatPrice,
                    });
                }
            }
            await Seat.insertMany(seats);
        }
        console.log('Created seats for all showtimes');

        console.log('Database seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};

seedDB();