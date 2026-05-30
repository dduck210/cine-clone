const express = require('express');
const router = express.Router();
const Cinema = require('../../models/Cinema');
const CinemaRoom = require('../../models/CinemaRoom');
const Showtime = require('../../models/Showtime');
const { protect, admin } = require('../../middleware/auth');
const { expireShowtimes } = require('../../jobs/expire-showtimes');
const { sendShowtimeCancelledEmail, sendRefundEmail } = require('../../services/email-service');
const { cancelShowtimesDbUpdates, loadBookingContext, getTodayFloor, buildEmergencyPreview } = require('../../controllers/admin/admin-helpers');

// POST /api/admin/emergency-close/rooms/preview
router.post('/emergency-close/rooms/preview', protect, admin, async (req, res) => {
    try {
        await expireShowtimes();
        const { cinemaId, roomIds = [] } = req.body || {};
        if (!cinemaId) return res.status(400).json({ message: 'Cinema ID is required' });
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            return res.status(400).json({ message: 'Select at least one room' });
        }

        const showtimes = await Showtime.find({
            cinema: cinemaId,
            room: { $in: roomIds },
            status: 'active',
            date: { $gte: getTodayFloor() },
        })
            .populate('movie', 'title')
            .populate('room', 'name')
            .sort({ date: 1, startTime: 1 });

        res.json(await buildEmergencyPreview(showtimes));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/emergency-close/rooms
router.post('/emergency-close/rooms', protect, admin, async (req, res) => {
    try {
        await expireShowtimes();
        const { cinemaId, roomIds = [] } = req.body || {};
        console.log('[admin] Emergency close rooms request for cinema:', cinemaId, 'rooms:', roomIds);
        if (!cinemaId) return res.status(400).json({ message: 'Cinema ID is required' });
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            return res.status(400).json({ message: 'Select at least one room' });
        }

        const showtimes = await Showtime.find({
            cinema: cinemaId,
            room: { $in: roomIds },
            status: 'active',
            date: { $gte: getTodayFloor() },
        });

        await CinemaRoom.updateMany({ _id: { $in: roomIds } }, { status: 'maintenance' });

        // Mark cinema as incident if ALL rooms are now in maintenance
        const allRooms = await CinemaRoom.find({ cinema: cinemaId });
        const anyActive = allRooms.some((r) => r.status === 'active');
        if (!anyActive) {
            await Cinema.findByIdAndUpdate(cinemaId, { status: 'incident' });
            console.log('[admin] Cinema marked incident (all rooms in maintenance):', cinemaId);
        }

        console.log('[admin] Performing DB updates for showtimes count:', showtimes.length);
        const dbResult = await cancelShowtimesDbUpdates(showtimes, 'Phòng chiếu gặp sự cố khẩn cấp');

        console.log('[admin] DB updates done, scheduling background email tasks for paid bookings:', dbResult.paidBookingIds.length);
        (async () => {
            try {
                for (const paidId of dbResult.paidBookingIds) {
                    try {
                        const bookingContext = await loadBookingContext(paidId);
                        await sendShowtimeCancelledEmail(bookingContext, 'Phòng chiếu gặp sự cố khẩn cấp');
                        await sendRefundEmail(bookingContext, 'Phòng chiếu gặp sự cố khẩn cấp');
                    } catch (e) {
                        console.error('Failed to send emails for booking', paidId, e.message);
                    }
                }
            } catch (e) {
                console.error('Background refund/email task failed', e.message);
            }
        })();

        res.json({ message: 'Selected rooms emergency closed', roomIds, ...dbResult });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/emergency-close/:id/preview
router.get('/emergency-close/:id/preview', protect, admin, async (req, res) => {
    try {
        await expireShowtimes();
        const showtimes = await Showtime.find({
            cinema: req.params.id,
            status: 'active',
            date: { $gte: getTodayFloor() },
        })
            .populate('movie', 'title')
            .populate('room', 'name')
            .sort({ date: 1, startTime: 1 });

        res.json(await buildEmergencyPreview(showtimes));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/admin/emergency-close/:id
router.post('/emergency-close/:id', protect, admin, async (req, res) => {
    try {
        await expireShowtimes();
        const showtimes = await Showtime.find({
            cinema: req.params.id,
            status: 'active',
            date: { $gte: getTodayFloor() },
        });

        await Cinema.findByIdAndUpdate(req.params.id, { status: 'incident' });

        const dbResult = await cancelShowtimesDbUpdates(showtimes, 'Rạp gặp sự cố khẩn cấp');

        (async () => {
            try {
                for (const paidId of dbResult.paidBookingIds) {
                    try {
                        const bookingContext = await loadBookingContext(paidId);
                        await sendShowtimeCancelledEmail(bookingContext, 'Rạp gặp sự cố khẩn cấp');
                        await sendRefundEmail(bookingContext, 'Rạp gặp sự cố khẩn cấp');
                    } catch (e) {
                        console.error('Failed to send emails for booking', paidId, e.message);
                    }
                }
            } catch (e) {
                console.error('Background refund/email task failed', e.message);
            }
        })();

        res.json({ message: 'Cinema emergency closed', ...dbResult });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
