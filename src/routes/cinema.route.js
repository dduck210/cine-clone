const router = require('express').Router();
const Cinema = require('../models/cinema.model');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');

// Get all cinemas
router.get('/', async (req, res) => {
    try {
        const cinemas = await Cinema.find({ status: 'active' });
        res.json(cinemas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get cinema by id
router.get('/:id', async (req, res) => {
    try {
        const cinema = await Cinema.findById(req.params.id);
        if (!cinema) return res.status(404).json({ message: 'Cinema không tìm thấy' });
        res.json(cinema);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create cinema (Admin only)
router.post('/', verifyToken, authorize('admin'), async (req, res) => {
    const cinema = new Cinema({
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        email: req.body.email,
        city: req.body.city,
        district: req.body.district,
        description: req.body.description,
        image: req.body.image
    });

    try {
        const newCinema = await cinema.save();
        res.status(201).json(newCinema);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update cinema (Admin only)
router.patch('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const cinema = await Cinema.findById(req.params.id);
        if (!cinema) return res.status(404).json({ message: 'Cinema không tìm thấy' });

        if (req.body.name) cinema.name = req.body.name;
        if (req.body.address) cinema.address = req.body.address;
        if (req.body.phone) cinema.phone = req.body.phone;
        if (req.body.email) cinema.email = req.body.email;
        if (req.body.city) cinema.city = req.body.city;
        if (req.body.district) cinema.district = req.body.district;
        if (req.body.description) cinema.description = req.body.description;
        if (req.body.image) cinema.image = req.body.image;
        if (req.body.status) cinema.status = req.body.status;

        const updatedCinema = await cinema.save();
        res.json(updatedCinema);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete cinema (Admin only)
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const cinema = await Cinema.findById(req.params.id);
        if (!cinema) return res.status(404).json({ message: 'Cinema không tìm thấy' });

        cinema.status = 'inactive';
        await cinema.save();
        res.json({ message: 'Cinema đã bị ẩn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
