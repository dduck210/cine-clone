const express = require('express');
const router = express.Router();
const CinemaRoom = require('../../models/CinemaRoom');
const Cinema = require('../../models/Cinema');
const Showtime = require('../../models/Showtime');
const Seat = require('../../models/Seat');
const { protect, admin } = require('../../middleware/auth');
const { countActualSeats, validateSeatMatrixIntegrity } = require('../../utils/seat-validator');
const notificationService = require('../../services/notification-service');
const { getTodayFloor } = require('../../controllers/admin/admin-helpers');
const { expireShowtimes } = require('../../jobs/expire-showtimes');

// GET /api/admin/rooms
router.get('/rooms', protect, admin, async (req, res) => {
    try {
        const rooms = await CinemaRoom.find().populate('cinema', 'name').sort({ cinema: 1, name: 1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/cinemas/:cinemaId/rooms
router.get('/cinemas/:cinemaId/rooms', protect, admin, async (req, res) => {
    try {
        const rooms = await CinemaRoom.find({ cinema: req.params.cinemaId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/rooms/:id/showtimes
router.get('/rooms/:id/showtimes', protect, admin, async (req, res) => {
    try {
        await expireShowtimes();
        const showtimes = await Showtime.find({
            room: req.params.id,
            date: { $gte: getTodayFloor() },
            status: { $in: ['active', 'expired'] },
        })
            .populate('movie', 'title')
            .sort({ date: 1, startTime: 1 });
        res.json(showtimes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/rooms
router.post('/rooms', protect, admin, async (req, res) => {
    try {
        const payload = { ...req.body };
        const hasMatrix = Array.isArray(payload.seatMatrix) && payload.seatMatrix.length > 0;

        if (hasMatrix) {
            const actualCount = countActualSeats(payload.seatMatrix);
            const integrity = validateSeatMatrixIntegrity(
                payload.seatMatrix,
                Number(payload.totalSeats),
                payload.roomType || 'Standard',
            );
            if (!integrity.valid) {
                return res.status(400).json({ message: 'Dữ liệu ma trận ghế không hợp lệ', errors: integrity.errors });
            }
            payload.totalSeats = actualCount;
        } else {
            payload.totalSeats = Number(payload.rows) * Number(payload.cols);
        }

        const room = new CinemaRoom(payload);
        await room.save();
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/admin/rooms/:id
router.put('/rooms/:id', protect, admin, async (req, res) => {
    try {
        const room = await CinemaRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const { name, rows, cols, roomType, status, seatMatrix } = req.body;
        if (name) room.name = name;
        if (rows) room.rows = rows;
        if (cols) room.cols = cols;
        if (status) room.status = status;

        const effectiveRoomType = roomType || room.roomType;

        if (seatMatrix !== undefined) {
            const actualCount = countActualSeats(seatMatrix);
            const expectedTotal = Number(req.body.totalSeats) || actualCount;
            const integrity = validateSeatMatrixIntegrity(seatMatrix, expectedTotal, effectiveRoomType);
            if (!integrity.valid) {
                return res.status(400).json({ message: 'Dữ liệu ma trận ghế không hợp lệ', errors: integrity.errors });
            }
            room.seatMatrix = seatMatrix;
            room.totalSeats = actualCount || room.rows * room.cols;
        }

        if (roomType) room.roomType = roomType;
        await room.save();
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/rooms/reopen
router.post('/rooms/reopen', protect, admin, async (req, res) => {
    try {
        const { cinemaId, roomIds = [] } = req.body || {};
        if (!cinemaId) return res.status(400).json({ message: 'Cinema ID is required' });
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            return res.status(400).json({ message: 'Select at least one room' });
        }

        await CinemaRoom.updateMany({ _id: { $in: roomIds } }, { status: 'active' });

        const allRooms = await CinemaRoom.find({ cinema: cinemaId });
        const cinemaRestored = allRooms.length > 0 && allRooms.every((r) => r.status === 'active');
        if (cinemaRestored) {
            await Cinema.findByIdAndUpdate(cinemaId, { status: 'active' });
        }

        notificationService.createNotification({
            type: 'rooms_reopened',
            title: 'Mở phòng chiếu',
            message: `Đã mở ${roomIds.length} phòng${cinemaRestored ? ' · Rạp đã khôi phục hoạt động' : ''}`,
            data: { cinemaId, roomIds, cinemaRestored },
        });

        res.json({ message: 'Rooms reopened', reopenedCount: roomIds.length, cinemaRestored });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/admin/seats/:id/lock
router.put('/seats/:id/lock', protect, admin, async (req, res) => {
    try {
        const { isLocked } = req.body;
        const seat = await Seat.findByIdAndUpdate(
            req.params.id,
            { isLocked: !!isLocked },
            { returnDocument: 'after' }
        );
        if (!seat) return res.status(404).json({ message: 'Seat not found' });
        res.json(seat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
