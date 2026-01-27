const router = require('express').Router();
const Combo = require('../models/combo.model');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');

// Get all combos
router.get('/', async (req, res) => {
    try {
        const combos = await Combo.find({ status: 'active' });
        res.json(combos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get combo by id
router.get('/:id', async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) return res.status(404).json({ message: 'Combo không tìm thấy' });
        res.json(combo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create combo (Admin only)
router.post('/', verifyToken, authorize('admin'), async (req, res) => {
    const combo = new Combo({
        name: req.body.name,
        description: req.body.description,
        items: req.body.items,
        price: req.body.price,
        image: req.body.image
    });

    try {
        const newCombo = await combo.save();
        res.status(201).json(newCombo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update combo (Admin only)
router.patch('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) return res.status(404).json({ message: 'Combo không tìm thấy' });

        if (req.body.name) combo.name = req.body.name;
        if (req.body.description) combo.description = req.body.description;
        if (req.body.items) combo.items = req.body.items;
        if (req.body.price) combo.price = req.body.price;
        if (req.body.image) combo.image = req.body.image;
        if (req.body.status) combo.status = req.body.status;

        const updatedCombo = await combo.save();
        res.json(updatedCombo);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete combo (Admin only)
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) return res.status(404).json({ message: 'Combo không tìm thấy' });

        combo.status = 'inactive';
        await combo.save();
        res.json({ message: 'Combo đã bị ẩn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
