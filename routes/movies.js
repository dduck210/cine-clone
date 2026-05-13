const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
router.get('/', async (req, res) => {
    try {
        const movies = await Movie.find({}).populate('genre');
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get movie by ID
// @route   GET /api/movies/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id).populate('genre');
        if (movie) {
            res.json(movie);
        } else {
            res.status(404).json({ message: 'Movie not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create movie
// @route   POST /api/movies
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
    const { title, genre, duration, poster, trailer, description, status, ageRestriction } = req.body;
    try {
        const movie = new Movie({
            title,
            genre,
            duration,
            poster,
            trailer,
            description,
            status,
            ageRestriction,
        });
        const createdMovie = await movie.save();
        res.status(201).json(createdMovie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update movie
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { title, duration, poster, trailer, description, status, ageRestriction, rating, cast, director } = req.body;
        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            { title, duration, poster, trailer, description, status, ageRestriction, rating, cast, director },
            { new: true }
        ).populate('genre');
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete movie
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        res.json({ message: 'Movie removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;