const express = require('express');
const router = express.Router();
const Cinema = require('../../models/Cinema');
const CinemaRoom = require('../../models/CinemaRoom');
const Showtime = require('../../models/Showtime');
const { protect, admin } = require('../../middleware/auth');
const { handleApiError } = require('../../utils/error-handler');
const { auditLog } = require('../../utils/audit-logger');
const notificationService = require('../../services/notification-service');
const { expireShowtimes } = require('../../jobs/expire-showtimes');
const { sendShowtimeCancelledEmail, sendRefundEmail } = require('../../services/email-service');
const { cancelShowtimesDbUpdates, loadBookingContext, getTodayFloor } = require('../../controllers/admin/admin-helpers');

// GET /api/admin/cinemas — PUBLIC (no auth — used by booking flow)
router.get('/cinemas', async (req, res) => {
    try {
        const cinemas = await Cinema.find({}).sort({ name: 1 });
        res.json(cinemas);
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi lấy danh sách rạp');
    }
});

// POST /api/admin/cinemas
router.post('/cinemas', protect, admin, async (req, res) => {
    try {
        const cinema = new Cinema(req.body);
        await cinema.save();
        auditLog(req, 'CREATE_CINEMA', 'Cinema', cinema._id, `Created cinema: ${cinema.name}`);
        res.status(201).json(cinema);
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi tạo rạp mới');
    }
});

// PUT /api/admin/cinemas/:id
router.put('/cinemas/:id', protect, admin, async (req, res) => {
    try {
        const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!cinema) return res.status(404).json({ success: false, message: 'Không tìm thấy rạp' });
        auditLog(req, 'UPDATE_CINEMA', 'Cinema', cinema._id, `Updated cinema: ${cinema.name}`);
        res.json(cinema);
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi cập nhật rạp');
    }
});

// PATCH /api/admin/cinemas/:id/status
router.patch('/cinemas/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'incident', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái rạp không hợp lệ' });
        }

        const cinema = await Cinema.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!cinema) return res.status(404).json({ message: 'Không tìm thấy rạp' });

        const STATUS_VI = { active: 'Hoạt động', incident: 'Bảo trì / Sự cố', inactive: 'Tạm đóng' };
        notificationService.createNotification({
            type: 'cinema_status',
            title: 'Cập nhật trạng thái rạp',
            message: `${cinema.name} chuyển sang trạng thái ${STATUS_VI[status] || status}`,
            data: { cinemaId: cinema._id.toString(), status },
        });

        try {
            const roomStatus = status === 'active' ? 'active' : 'maintenance';
            await CinemaRoom.updateMany({ cinema: cinema._id }, { status: roomStatus });
        } catch (err) {
            console.error('Failed to update room statuses for cinema:', cinema._id, err.message);
        }

        if (status === 'incident') {
            await expireShowtimes();
            const showtimes = await Showtime.find({
                cinema: cinema._id,
                status: 'active',
                date: { $gte: getTodayFloor() },
            });

            if (showtimes.length > 0) {
                const cancelResult = await cancelShowtimesDbUpdates(showtimes, 'Rạp tạm thời bảo trì');
                (async () => {
                    for (const paidId of cancelResult.paidBookingIds) {
                        try {
                            const bookingContext = await loadBookingContext(paidId);
                            await sendShowtimeCancelledEmail(bookingContext, 'Rạp tạm thời bảo trì');
                            await sendRefundEmail(bookingContext, 'Rạp tạm thời bảo trì');
                        } catch (e) { console.error(e); }
                    }
                })();
                return res.json({ ...cinema.toObject(), ...cancelResult });
            }
        }
        res.json(cinema);
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi cập nhật trạng thái rạp');
    }
});

module.exports = router;
