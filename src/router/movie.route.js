const router = require('express').Router();
const Movie = require('../models/movie.model');
const Showtime = require('../models/showtime.model');

function formatMovie(movieDoc) {
    if (!movieDoc) return null;

    const movie = movieDoc.toObject ? movieDoc.toObject() : movieDoc;

    const genres = Array.isArray(movie.genres)
        ? movie.genres.map(g => (typeof g === 'string' ? g : g.name || '')).filter(Boolean)
        : [];

    const duration = Number(movie.duration) || 0;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return {
        id: movie._id,
        title: movie.title,
        description: movie.description,
        poster: movie.posterUrl || movie.poster || '',
        posterUrl: movie.posterUrl || movie.poster || '',
        duration: duration,
        durationFormatted: `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`,
        ageLimit: movie.ageLimit,
        trailerUrl: movie.trailerUrl,
        rating: movie.rating || 0,
        reviewCount: movie.reviewCount || 0,
        releaseDate: movie.releaseDate,
        status: movie.status,
        isNowShowing: movie.status === 'now_showing',
        genre: genres.join(', '),
        genres: genres,
        director: movie.director,
        cast: movie.cast,
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt
    };
}

// Get all movies with filters
router.get('/', async (req, res) => {
    try {
        const { status, search, genre } = req.query;
        let query = {};

        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };
        if (genre) query.genres = genre;

        const movies = await Movie.find(query).populate('genres');
        res.json(movies.map(formatMovie));
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

        res.json(movies.map(formatMovie));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get now showing movies
router.get('/now_showing', async (req, res) => {
    try {
        const movies = await Movie.find({ status: 'now_showing' }).populate('genres');
        res.json(movies.map(formatMovie));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get coming soon movies
router.get('/coming_soon', async (req, res) => {
    try {
        const movies = await Movie.find({ status: 'coming_soon' }).populate('genres');
        res.json(movies.map(formatMovie));
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
            ...formatMovie(movie),
            showtimes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;