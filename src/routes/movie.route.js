const router = require('express').Router();
const Movie = require('../models/movie.model');
const Showtime = require('../models/showtime.model');

// Get all movies with filters
router.get('/', async (req, res) => {
    try {
        const { status, search, genre } = req.query;
        let query = {};

        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };
        if (genre) query.genres = genre;

        const movies = await Movie.find(query).populate('genres');
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get movie by id with showtimes
router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id).populate('genres');
        if (!movie) return res.status(404).json({ message: 'Phim không tìm thấy' });

        // Get upcoming showtimes
        const showtimes = await Showtime.find({
            movieId: req.params.id,
            startTime: { $gte: new Date() }
        })
            .populate('roomId')
            .populate('cinemaId')
            .sort({ startTime: 1 });

        res.json({
            ...movie.toObject(),
            showtimes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search movies by name or genre
router.get('/search/query', async (req, res) => {
    try {
        const { q } = req.query;
        const movies = await Movie.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ],
            status: { $in: ['now_showing', 'coming_soon'] }
        }).populate('genres');

        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;