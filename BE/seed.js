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
                poster: 'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7KiyihwAR.jpg',
                trailer: 'https://www.youtube.com/watch?v=eOviiWA-_yc',
                description: 'Earth\'s mightiest heroes must come together to prevent an alien invasion.',
                rating: 8,
                status: 'now_showing',
                ageRestriction: '13+',
            },
            {
                title: 'Superbad',
                genre: [createdGenres[1]._id],
                duration: 113,
                poster: 'https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg',
                trailer: 'https://www.youtube.com/watch?v=H9H0ujS28xo',
                description: 'Two misfit friends try to navigate high school and get girls.',
                rating: 7.6,
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
                rating: 9.3,
                status: 'now_showing',
                ageRestriction: '15+',
            },
            {
                title: 'The Ring',
                genre: [createdGenres[3]._id],
                duration: 115,
                poster: 'https://image.tmdb.org/t/p/w500/lZl4LFGG3dqVNEoMGPkEGQFKPvL.jpg',
                trailer: 'https://www.youtube.com/watch?v=HQuC_yW_8aE',
                description: 'A woman must deal with a mysterious videotape that kills anyone who watches it.',
                rating: 7.1,
                status: 'now_showing',
                ageRestriction: '18+',
            },
            {
                title: 'The Notebook',
                genre: [createdGenres[4]._id],
                duration: 123,
                poster: 'https://image.tmdb.org/t/p/w500/qom1SZSENdmHFNZBXbtLAGido1v.jpg',
                trailer: 'https://www.youtube.com/watch?v=FCWyj-zt3r8',
                description: 'A poor man falls in love with a rich girl but they are separated due to class differences.',
                rating: 7.8,
                status: 'now_showing',
                ageRestriction: 'All ages',
            },
            {
                title: 'Interstellar',
                genre: [createdGenres[5]._id, createdGenres[2]._id],
                duration: 169,
                poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                trailer: 'https://www.youtube.com/watch?v=zSID6FbzZkE',
                description: 'A team of astronauts must travel through a wormhole to save humanity.',
                rating: 8.6,
                status: 'coming_soon',
                ageRestriction: 'All ages',
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
            { movie: createdMovies[0]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(1), startTime: '10:00', basePrice: 80000, totalSeats: 80 },
            { movie: createdMovies[0]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(1), startTime: '14:00', basePrice: 80000, totalSeats: 80 },
            { movie: createdMovies[1]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(2), startTime: '18:00', basePrice: 90000, totalSeats: 120 },
            { movie: createdMovies[2]._id, cinema: createdCinemas[0]._id, room: createdRooms[1]._id, date: daysFromNow(3), startTime: '20:00', basePrice: 100000, totalSeats: 48 },
            { movie: createdMovies[3]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(4), startTime: '09:00', basePrice: 75000, totalSeats: 120 },
            { movie: createdMovies[4]._id, cinema: createdCinemas[0]._id, room: createdRooms[0]._id, date: daysFromNow(5), startTime: '19:30', basePrice: 85000, totalSeats: 80 },
            { movie: createdMovies[5]._id, cinema: createdCinemas[0]._id, room: createdRooms[1]._id, date: daysFromNow(6), startTime: '15:00', basePrice: 110000, totalSeats: 48 },
            { movie: createdMovies[2]._id, cinema: createdCinemas[1]._id, room: createdRooms[2]._id, date: daysFromNow(7), startTime: '11:00', basePrice: 90000, totalSeats: 120 },
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