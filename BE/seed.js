const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Genre = require('./models/Genre');
const Movie = require('./models/Movie');
const Cinema = require('./models/Cinema');
const CinemaRoom = require('./models/CinemaRoom');
const Showtime = require('./models/Showtime');
const Seat = require('./models/Seat');

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

        // Clear existing data
        await Genre.deleteMany({});
        await Movie.deleteMany({});
        await Cinema.deleteMany({});
        await CinemaRoom.deleteMany({});
        await Showtime.deleteMany({});
        await Seat.deleteMany({});

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
                poster: 'https://via.placeholder.com/300x450?text=The+Avengers',
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
                poster: 'https://via.placeholder.com/300x450?text=Superbad',
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
                poster: 'https://via.placeholder.com/300x450?text=Shawshank',
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
                poster: 'https://via.placeholder.com/300x450?text=The+Ring',
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
                poster: 'https://via.placeholder.com/300x450?text=The+Notebook',
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
                poster: 'https://via.placeholder.com/300x450?text=Interstellar',
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
                roomType: 'standard',
            },
            {
                cinema: createdCinemas[0]._id,
                name: 'Room B (VIP)',
                rows: 6,
                cols: 8,
                totalSeats: 48,
                roomType: 'vip',
            },
            {
                cinema: createdCinemas[1]._id,
                name: 'Room A',
                rows: 10,
                cols: 12,
                totalSeats: 120,
                roomType: 'premium',
            },
        ];

        const createdRooms = await CinemaRoom.insertMany(rooms);
        console.log(`Created ${createdRooms.length} rooms`);

        // Create showtimes
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const showtimes = [
            {
                movie: createdMovies[0]._id,
                cinema: createdCinemas[0]._id,
                room: createdRooms[0]._id,
                date: today,
                startTime: '10:00',
                endTime: '12:23',
                price: 120000,
                totalSeats: 80,
                availableSeats: 80,
            },
            {
                movie: createdMovies[0]._id,
                cinema: createdCinemas[0]._id,
                room: createdRooms[0]._id,
                date: today,
                startTime: '14:00',
                endTime: '16:23',
                price: 120000,
                totalSeats: 80,
                availableSeats: 80,
            },
            {
                movie: createdMovies[1]._id,
                cinema: createdCinemas[1]._id,
                room: createdRooms[2]._id,
                date: tomorrow,
                startTime: '18:00',
                endTime: '19:53',
                price: 150000,
                totalSeats: 120,
                availableSeats: 120,
            },
            {
                movie: createdMovies[2]._id,
                cinema: createdCinemas[0]._id,
                room: createdRooms[1]._id,
                date: today,
                startTime: '20:00',
                endTime: '22:23',
                price: 180000,
                totalSeats: 48,
                availableSeats: 48,
            },
        ];

        const createdShowtimes = await Showtime.insertMany(showtimes);
        console.log(`Created ${createdShowtimes.length} showtimes`);

        // Create seats for each showtime
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