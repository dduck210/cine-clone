const Showtime = require('../models/Showtime');
const CinemaRoom = require('../models/CinemaRoom');
const Seat = require('../models/Seat');

// Get all showtimes with filters
const getShowtimes = async (req, res) => {
    console.log('🔵 getShowtimes called');
    try {
        const { movieId, cinemaId, date } = req.query;
        const filter = { status: 'active' };

        if (movieId) filter.movie = movieId;
        if (cinemaId) filter.cinema = cinemaId;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            filter.date = { $gte: startDate, $lt: endDate };
        }

        console.log('🔵 Filter:', filter);
        const showtimes = await Showtime.find(filter)
            .populate('movie')
            .populate('cinema')
            .populate('room')
            .sort({ date: 1, startTime: 1 });

        console.log('🔵 Found', showtimes.length, 'showtimes');
        res.json(showtimes);
    } catch (error) {
        console.error('🔴 Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get showtime by ID with seats
const getShowtimeById = async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie')
            .populate('cinema')
            .populate('room');

        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

        const seats = await Seat.find({ showtime: req.params.id }).sort({ row: 1, col: 1 });

        res.json({ showtime, seats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create showtime (admin only)
const createShowtime = async (req, res) => {
    const { movieId, cinemaId, roomId, date, startTime, price } = req.body;

    try {
        const room = await CinemaRoom.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Calculate end time (assume 2.5 hours for movies)
        const [hour, min] = startTime.split(':').map(Number);
        const endHour = Math.floor((hour * 60 + min + 150) / 60) % 24;
        const endMin = (hour * 60 + min + 150) % 60;
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

        const showtime = new Showtime({
            movie: movieId,
            cinema: cinemaId,
            room: roomId,
            date: new Date(date),
            startTime,
            endTime,
            price,
            totalSeats: room.totalSeats,
            availableSeats: room.totalSeats,
        });

        await showtime.save();

        // Create seats
        const seats = [];
        for (let i = 0; i < room.rows; i++) {
            const row = String.fromCharCode(65 + i); // A, B, C...
            for (let j = 1; j <= room.cols; j++) {
                seats.push({
                    showtime: showtime._id,
                    room: roomId,
                    row,
                    col: j,
                    seatNumber: `${row}${j}`,
                    price,
                });
            }
        }

        await Seat.insertMany(seats);

        res.status(201).json(showtime);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update showtime (admin only)
const updateShowtime = async (req, res) => {
    try {
        const { date, startTime, price } = req.body;
        const showtime = await Showtime.findByIdAndUpdate(
            req.params.id,
            { date, startTime, price },
            { new: true }
        );

        if (showtime) {
            res.json(showtime);
        } else {
            res.status(404).json({ message: 'Showtime not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cancel showtime (admin only)
const cancelShowtime = async (req, res) => {
    try {
        const showtime = await Showtime.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        );

        if (showtime) {
            res.json({ message: 'Showtime cancelled', showtime });
        } else {
            res.status(404).json({ message: 'Showtime not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getShowtimes,
    getShowtimeById,
    createShowtime,
    updateShowtime,
    cancelShowtime,
};