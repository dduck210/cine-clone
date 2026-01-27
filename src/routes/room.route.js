const router = require('express').Router();
const Room = require('../models/room.model');
const Cinema = require('../models/cinema.model');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');

// Get all rooms
router.get('/', async (req, res) => {
    try {
        const cinemaId = req.query.cinemaId;
        const query = cinemaId ? { cinemaId } : {};
        const rooms = await Room.find(query).populate('cinemaId');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get room by id with seat layout
router.get('/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('cinemaId');
        if (!room) return res.status(404).json({ message: 'Phòng chiếu không tìm thấy' });
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create room (Admin only)
router.post('/', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { cinemaId, name, rows, columns } = req.body;

        // Check cinema exists
        const cinema = await Cinema.findById(cinemaId);
        if (!cinema) return res.status(404).json({ message: 'Rạp không tìm thấy' });

        const room = new Room({
            cinemaId,
            name,
            rows,
            columns,
            totalSeats: rows * columns
        });

        const newRoom = await room.save();
        res.status(201).json(newRoom);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update room (Admin only)
router.patch('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Phòng chiếu không tìm thấy' });

        if (req.body.name) room.name = req.body.name;
        if (req.body.rows) room.rows = req.body.rows;
        if (req.body.columns) room.columns = req.body.columns;
        if (req.body.status) room.status = req.body.status;

        if (req.body.rows || req.body.columns) {
            room.totalSeats = room.rows * room.columns;
        }

        const updatedRoom = await room.save();
        res.json(updatedRoom);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete room (Admin only)
router.delete('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Phòng chiếu không tìm thấy' });

        room.status = 'inactive';
        await room.save();
        res.json({ message: 'Phòng chiếu đã bị ẩn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
