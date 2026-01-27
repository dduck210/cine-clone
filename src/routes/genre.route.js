const router = require('express').Router();
const Genre = require('../models/genre.model');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');

// Get all genres
router.get('/', async (req, res) => {
    try {
        const genres = await Genre.find({ status: 'active' });
        res.json(genres);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get genre by id
router.get('/:id', async (req, res) => {
    try {
        const genre = await Genre.findById(req.params.id);
        if (!genre) return res.status(404).json({ message: 'Thể loại không tìm thấy' });
        res.json(genre);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create genre (Admin only)
router.post('/', verifyToken, authorize('admin'), async (req, res) => {
    const genre = new Genre({
        name: req.body.name,
        description: req.body.description
    });

    try {
        const newGenre = await genre.save();
        res.status(201).json(newGenre);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update genre (Admin only)
router.patch('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const genre = await Genre.findById(req.params.id);
        if (!genre) return res.status(404).json({ message: 'Thể loại không tìm thấy' });

        if (req.body.name) genre.name = req.body.name;
        if (req.body.description) genre.description = req.body.description;
        if (req.body.status) genre.status = req.body.status;

        const updatedGenre = await genre.save();
        res.json(updatedGenre);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete genre (Admin only)
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const genre = await Genre.findById(req.params.id);
        if (!genre) return res.status(404).json({ message: 'Thể loại không tìm thấy' });

        genre.status = 'inactive';
        await genre.save();
        res.json({ message: 'Thể loại đã bị ẩn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
