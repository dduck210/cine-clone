require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const Genre = require('../models/Genre');
const Movie = require('../models/Movie');
const Cinema = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const { getTimeSlot, getDayTypeFromDate, calcEndTime, calcPriceConfig } = require('../utils/pricing');

const NEW_MOVIES = [
    // ── Phim hành động ──
    { title: 'Fast X', duration: 141, rating: 7.2, status: 'now_showing', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/fiVW06jE7z9YnO4trhaMEdclSiC.jpg',
      trailer: 'https://www.youtube.com/watch?v=32RAq6JzY-w',
      description: 'Dom Toretto và gia đình đối mặt với kẻ thù nguy hiểm nhất từ trước tới nay — con trai của Hernan Reyes.' },
    { title: 'Mission: Impossible – Dead Reckoning', duration: 163, rating: 7.7, status: 'now_showing', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
      trailer: 'https://www.youtube.com/watch?v=avz06PDqDbM',
      description: 'Ethan Hunt phải ngăn chặn một AI nguy hiểm trước khi nó rơi vào tay kẻ xấu.' },
    { title: 'John Wick: Chapter 4', duration: 169, rating: 7.7, status: 'now_showing', ageRestriction: '18+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
      trailer: 'https://www.youtube.com/watch?v=qEVUtrk8_B4',
      description: 'John Wick tìm đường đến tự do bằng cách hạ gục Marquis, người nắm quyền lực tuyệt đối trong Hội Đồng Nổi.' },
    { title: 'Guardians of the Galaxy Vol. 3', duration: 150, rating: 7.9, status: 'now_showing', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
      trailer: 'https://www.youtube.com/watch?v=u3V5KDHRQvk',
      description: 'Rocket phải đối mặt với quá khứ đau thương khi các Guardians lên đường để giải cứu người bạn.' },
    { title: 'Deadpool & Wolverine', duration: 127, rating: 7.8, status: 'now_showing', ageRestriction: '18+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      trailer: 'https://www.youtube.com/watch?v=73_1biulkYk',
      description: 'Deadpool và Wolverine cùng nhau chiến đấu qua đa vũ trụ trong cuộc phiêu lưu đầy máu me và hài hước.' },
    { title: 'Captain America: Brave New World', duration: 118, rating: 6.2, status: 'now_showing', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
      trailer: 'https://www.youtube.com/watch?v=K4ycgUXcP58',
      description: 'Sam Wilson khoác lên mình lá chắn Captain America và phải ngăn chặn cuộc khủng hoảng ngoại giao toàn cầu.' },
    { title: 'Aquaman and the Lost Kingdom', duration: 124, rating: 5.4, status: 'now_showing', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg',
      trailer: 'https://www.youtube.com/watch?v=FoQiQhEaJBs',
      description: 'Arthur Curry phải liên minh với kẻ thù không đội trời chung để bảo vệ Atlantis trước mối đe dọa mới.' },
    { title: 'Thunderbolts*', duration: 127, rating: 7.4, status: 'now_showing', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/m9EtP9pMCHxBjLfToACQEoMuvpq.jpg',
      trailer: 'https://www.youtube.com/watch?v=hIR8e6nrQ4s',
      description: 'Một nhóm anh hùng bất đắc dĩ tập hợp lại để đối mặt với mối đe dọa bí ẩn đang đe dọa thế giới.' },
    { title: 'Godzilla x Kong: The New Empire', duration: 115, rating: 6.0, status: 'now_showing', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLy9d69VjxE1iLGa.jpg',
      trailer: 'https://www.youtube.com/watch?v=odM92ap8_c0',
      description: 'Godzilla và Kong phải liên kết để đối mặt với một thế lực mới nguy hiểm hơn cả hai cộng lại.' },
    { title: 'Kingdom of the Planet of the Apes', duration: 145, rating: 7.1, status: 'now_showing', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
      trailer: 'https://www.youtube.com/watch?v=XaQeUAjSH7E',
      description: 'Nhiều thế kỷ sau vương quốc của Caesar, một thanh niên vượn trẻ hành trình khám phá thế giới bị con người bỏ lại.' },
    // ── Phim khoa học viễn tưởng ──
    { title: 'Dune: Part Two', duration: 166, rating: 8.5, status: 'now_showing', ageRestriction: '13+', genre: 'Sci-Fi',
      poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      trailer: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      description: 'Paul Atreides liên minh với người Fremen để trả thù gia tộc đã hủy diệt gia đình mình.' },
    { title: 'Oppenheimer', duration: 180, rating: 8.3, status: 'now_showing', ageRestriction: '15+', genre: 'Drama',
      poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      description: 'Câu chuyện của J. Robert Oppenheimer và hành trình sáng tạo ra bom nguyên tử trong Thế chiến II.' },
    { title: 'Transformers: Rise of the Beasts', duration: 127, rating: 6.0, status: 'now_showing', ageRestriction: '13+', genre: 'Sci-Fi',
      poster: 'https://image.tmdb.org/t/p/w500/gPbM0MK8CP8A174rmUwGsADNYKD.jpg',
      trailer: 'https://www.youtube.com/watch?v=iMXOJbDKRsI',
      description: 'Autobots liên minh với Maximals để ngăn chặn Unicron xuyên thủng vũ trụ và tiêu diệt Trái Đất.' },
    { title: 'Alien: Romulus', duration: 119, rating: 7.4, status: 'now_showing', ageRestriction: '18+', genre: 'Sci-Fi',
      poster: 'https://image.tmdb.org/t/p/w500/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg',
      trailer: 'https://www.youtube.com/watch?v=HKZGZ_w-CPo',
      description: 'Một nhóm thanh niên khám phá trạm vũ trụ bị bỏ hoang và đối mặt với sinh vật ngoài hành tinh kinh hoàng nhất.' },
    // ── Phim kinh dị ──
    { title: 'Smile 2', duration: 127, rating: 6.6, status: 'now_showing', ageRestriction: '18+', genre: 'Horror',
      poster: 'https://image.tmdb.org/t/p/w500/ht8Uv9QPv9y7K0RygTeLiLgcys.jpg',
      trailer: 'https://www.youtube.com/watch?v=GBMApBH6T3s',
      description: 'Một ngôi sao pop nổi tiếng bắt đầu trải qua những sự kiện kinh hoàng và những nụ cười ám ảnh bí ẩn.' },
    { title: 'A Quiet Place: Day One', duration: 99, rating: 7.1, status: 'now_showing', ageRestriction: '15+', genre: 'Horror',
      poster: 'https://image.tmdb.org/t/p/w500/yrpPYKijwdMHyTGIOd1iK1h0Xno.jpg',
      trailer: 'https://www.youtube.com/watch?v=Sp-Eb4gyZ9I',
      description: 'Khám phá những sự kiện ngày đầu tiên khi loài sinh vật săn mồi bằng âm thanh xâm chiếm Trái Đất.' },
    { title: 'The Substance', duration: 141, rating: 7.4, status: 'now_showing', ageRestriction: '18+', genre: 'Horror',
      poster: 'https://image.tmdb.org/t/p/w500/lqoMzCcZYEFK729d6qzt349fB4o.jpg',
      trailer: 'https://www.youtube.com/watch?v=B1lPNGFOSeo',
      description: 'Một loại thuốc bí ẩn hứa hẹn tạo ra phiên bản tốt hơn của bạn nhưng ẩn chứa cái giá kinh hoàng.' },
    // ── Phim hài / gia đình ──
    { title: 'Barbie', duration: 114, rating: 7.0, status: 'now_showing', ageRestriction: 'All ages', genre: 'Comedy',
      poster: 'https://image.tmdb.org/t/p/w500/iuFNMS8vlbOaipHmYhTLLikWMRd.jpg',
      trailer: 'https://www.youtube.com/watch?v=pBk4NYhWNMM',
      description: 'Barbie rời Barbieland để tìm kiếm ý nghĩa cuộc sống thực sự trong thế giới của con người.' },
    { title: 'Inside Out 2', duration: 100, rating: 7.8, status: 'now_showing', ageRestriction: 'All ages', genre: 'Comedy',
      poster: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
      trailer: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
      description: 'Riley bước vào tuổi teen và Joy phải đối mặt với cảm xúc mới — Anxiety — đang chiếm quyền kiểm soát.' },
    { title: 'Moana 2', duration: 100, rating: 6.9, status: 'now_showing', ageRestriction: 'All ages', genre: 'Comedy',
      poster: 'https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg',
      trailer: 'https://www.youtube.com/watch?v=2IXKE5dxQLw',
      description: 'Moana lên đường khám phá những vùng biển xa xôi sau khi nhận được lời gọi bí ẩn từ tổ tiên.' },
    { title: 'Sonic the Hedgehog 3', duration: 110, rating: 7.0, status: 'now_showing', ageRestriction: 'All ages', genre: 'Comedy',
      poster: 'https://image.tmdb.org/t/p/w500/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg',
      trailer: 'https://www.youtube.com/watch?v=hQMSPMFLHxc',
      description: 'Sonic, Tails và Knuckles phải đối mặt với Shadow the Hedgehog trong cuộc chiến sinh tử.' },
    // ── Phim tình cảm / drama ──
    { title: 'Wicked', duration: 160, rating: 7.7, status: 'now_showing', ageRestriction: 'All ages', genre: 'Romance',
      poster: 'https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6SHBcw.jpg',
      trailer: 'https://www.youtube.com/watch?v=6COmYeLsz4c',
      description: 'Câu chuyện chưa được kể về tình bạn của phù thủy Elphaba và Glinda trước sự kiện Wizard of Oz.' },
    { title: 'It Ends with Us', duration: 130, rating: 6.5, status: 'now_showing', ageRestriction: '18+', genre: 'Romance',
      poster: 'https://image.tmdb.org/t/p/w500/4F3TuZgrJGtOEIHMbrqBBV2WCom.jpg',
      trailer: 'https://www.youtube.com/watch?v=vDMGGKWuaeA',
      description: 'Lily Bloom đối mặt với quyết định khó khăn nhất cuộc đời khi tình yêu và sức mạnh nội tâm được thử thách.' },
    { title: 'Killers of the Flower Moon', duration: 206, rating: 7.6, status: 'now_showing', ageRestriction: '18+', genre: 'Drama',
      poster: 'https://image.tmdb.org/t/p/w500/dB6UCEz0IgHiM0MUhAGCPOHLJTe.jpg',
      trailer: 'https://www.youtube.com/watch?v=EP34Yoxs3FQ',
      description: 'Câu chuyện bi thảm về cái chết bí ẩn của người dân Osage Nation và hành trình điều tra của FBI.' },
    // ── Phim Việt Nam ──
    { title: 'Kẻ Ăn Hồn', duration: 113, rating: 6.8, status: 'now_showing', ageRestriction: '18+', genre: 'Horror',
      poster: 'https://image.tmdb.org/t/p/w500/7GHjmeFKXpXr89T1HqXIDxBcBWm.jpg',
      trailer: 'https://www.youtube.com/watch?v=yAJj-GXXpGU',
      description: 'Hai chị em trở về ngôi làng cổ và phải đối mặt với thế lực hắc ám ăn mòn linh hồn con người.' },
    { title: 'Nhà Bà Nữ', duration: 127, rating: 7.5, status: 'now_showing', ageRestriction: 'All ages', genre: 'Comedy',
      poster: 'https://image.tmdb.org/t/p/w500/bkjWFjYbCXOSMoTKjPJgajvLNlg.jpg',
      trailer: 'https://www.youtube.com/watch?v=Zqn8NFVTFSQ',
      description: 'Câu chuyện hài hước và cảm động về một gia đình Việt Nam đông đúc với đủ mọi tính cách con người.' },
    { title: 'Em và Trịnh', duration: 141, rating: 6.9, status: 'now_showing', ageRestriction: 'All ages', genre: 'Romance',
      poster: 'https://image.tmdb.org/t/p/w500/cIkKmqdN8LFqaJu77kYl8wM0UF9.jpg',
      trailer: 'https://www.youtube.com/watch?v=pMV8fBuMmI8',
      description: 'Cuộc đời và tình yêu của nhạc sĩ huyền thoại Trịnh Công Sơn qua những năm tháng sống động nhất.' },
    // ── Phim sắp chiếu ──
    { title: 'The Fantastic Four: First Steps', duration: 130, rating: 0, status: 'coming_soon', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/9l1eZiJHmhr5jIlthMdJN5WYoff.jpg',
      trailer: 'https://www.youtube.com/watch?v=FX4ykbDuSiU',
      description: 'Bộ tứ siêu dị đối mặt với mối đe dọa vũ trụ trong kỷ nguyên vàng son của khám phá không gian.' },
    { title: 'Jurassic World Rebirth', duration: 140, rating: 0, status: 'coming_soon', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/oGBfBEDjlAXJeFNiuxJJEFTpBIM.jpg',
      trailer: 'https://www.youtube.com/watch?v=rMR46OPcB0o',
      description: 'Một đội thám hiểm đến hòn đảo bí ẩn nơi những con khủng long tiến hóa lớn nhất vẫn đang sinh sống.' },
    { title: 'Avengers: Doomsday', duration: 0, rating: 0, status: 'coming_soon', ageRestriction: '13+', genre: 'Action',
      poster: 'https://image.tmdb.org/t/p/w500/lbON2EJDEYB1UDRg5vdUOv74bBP.jpg',
      trailer: 'https://www.youtube.com/watch?v=RlOB3UALvrQ',
      description: 'Các Avengers hợp sức để đối mặt với Doctor Doom — kẻ thù mạnh nhất mà họ từng chạm trán.' },
];

const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0);
    return d;
};

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // Get existing genres
        const allGenres = await Genre.find({});
        const genreMap = {};
        allGenres.forEach(g => { genreMap[g.name] = g._id; });

        // Get cinemas and rooms
        const cinemas = await Cinema.find({});
        const rooms = await CinemaRoom.find({});
        if (!cinemas.length || !rooms.length) {
            console.error('No cinemas or rooms found. Run seed.js first.');
            process.exit(1);
        }

        console.log(`Found ${cinemas.length} cinemas, ${rooms.length} rooms`);

        // Map rooms by cinema
        const roomsByCinema = {};
        rooms.forEach(r => {
            const key = r.cinema.toString();
            if (!roomsByCinema[key]) roomsByCinema[key] = [];
            roomsByCinema[key].push(r);
        });

        // Insert new movies
        const moviesToInsert = NEW_MOVIES.map(m => {
            const genreId = genreMap[m.genre];
            return {
                title: m.title,
                genre: genreId ? [genreId] : [],
                duration: m.duration || 120,
                poster: m.poster,
                trailer: m.trailer,
                description: m.description,
                rating: m.rating,
                status: m.status,
                ageRestriction: m.ageRestriction,
                releaseDate: m.status === 'now_showing' ? new Date() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            };
        });

        const insertedMovies = await Movie.insertMany(moviesToInsert);
        console.log(`Inserted ${insertedMovies.length} new movies`);

        // Create showtimes only for now_showing movies
        const nowShowingMovies = insertedMovies.filter((_, i) => NEW_MOVIES[i].status === 'now_showing');

        const TIME_SLOTS = ['09:30', '11:45', '14:00', '16:15', '19:00', '21:15'];
        const BASE_PRICES = [75000, 80000, 85000, 90000, 95000, 100000];

        const showtimeData = [];

        // Distribute movies across cinemas/rooms over next 14 days
        nowShowingMovies.forEach((movie, idx) => {
            const movieOrigIdx = NEW_MOVIES.findIndex(m => m.title === movie.title);
            const origMovie = NEW_MOVIES[movieOrigIdx];

            cinemas.forEach((cinema, cIdx) => {
                const cinemaRooms = roomsByCinema[cinema._id.toString()] || [];
                if (!cinemaRooms.length) return;

                // Each movie shows in 1 room per cinema, rotate room assignment
                const room = cinemaRooms[idx % cinemaRooms.length];

                // Show for 10 days, 2-3 time slots per day
                for (let day = 1; day <= 10; day++) {
                    // Pick 2 or 3 time slots staggered by movie index to avoid conflicts
                    const slotOffset = (idx + cIdx) % 3;
                    const daySlots = [
                        TIME_SLOTS[(slotOffset * 2) % TIME_SLOTS.length],
                        TIME_SLOTS[(slotOffset * 2 + 3) % TIME_SLOTS.length],
                    ];

                    // Weekend gets an extra night slot
                    const date = daysFromNow(day);
                    const dayOfWeek = date.getDay();
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        daySlots.push(TIME_SLOTS[5]);
                    }

                    // Remove duplicates
                    const uniqueSlots = [...new Set(daySlots)];

                    uniqueSlots.forEach(startTime => {
                        const basePrice = BASE_PRICES[idx % BASE_PRICES.length];
                        showtimeData.push({
                            movie: movie._id,
                            cinema: cinema._id,
                            room: room._id,
                            date,
                            startTime,
                            basePrice,
                            totalSeats: room.totalSeats,
                            duration: origMovie.duration || 120,
                        });
                    });
                }
            });
        });

        // Build showtime documents
        const showtimeDocs = showtimeData.map(({ totalSeats, duration, ...st }) => {
            const timeSlot = getTimeSlot(st.startTime);
            const dayType = getDayTypeFromDate(st.date);
            const endTime = calcEndTime(st.startTime, duration);
            const priceConfig = calcPriceConfig(st.basePrice, timeSlot, dayType);
            return { ...st, timeSlot, dayType, endTime, priceConfig, totalSeats, availableSeats: totalSeats, status: 'active' };
        });

        const createdShowtimes = await Showtime.insertMany(showtimeDocs);
        console.log(`Inserted ${createdShowtimes.length} showtimes`);

        // Create seats for each new showtime
        let totalSeatsCreated = 0;
        for (const showtime of createdShowtimes) {
            const room = rooms.find(r => r._id.equals(showtime.room));
            if (!room) continue;
            const seats = [];
            for (let i = 0; i < room.rows; i++) {
                const row = String.fromCharCode(65 + i);
                const isVip = room.rows >= 6 && i >= room.rows - 2;
                const isCouple = room.rows >= 6 && i === room.rows - 1;
                const seatType = isCouple ? 'couple' : isVip ? 'vip' : 'normal';
                const seatPrice = showtime.priceConfig[seatType];
                for (let j = 1; j <= room.cols; j++) {
                    seats.push({
                        showtime: showtime._id,
                        room: showtime.room,
                        row, col: j,
                        seatNumber: `${row}${j}`,
                        type: seatType,
                        status: 'available',
                        price: seatPrice,
                    });
                }
            }
            await Seat.insertMany(seats);
            totalSeatsCreated += seats.length;
        }

        console.log(`Created ${totalSeatsCreated} seats`);
        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

run();
