const express = require('express');
const router = express.Router();
const Cinema = require('../models/Cinema');
const CinemaRoom = require('../models/CinemaRoom');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Seat = require('../models/Seat');
const { protect, admin } = require('../middleware/auth');
const { expireShowtimes } = require('../jobs/expire-showtimes');
const { isShowtimeExpired } = require('../utils/showtime-status');
const {
    sendPaymentSuccessEmail,
    sendRefundEmail,
    sendShowtimeCancelledEmail,
} = require('../services/email-service');
const notificationService = require('../services/notification-service');
const ticketEvents = require('../services/ticket-event-emitter');

function countSeatsFromMatrix(seatMatrix = []) {
    let totalSeats = 0;
    for (const row of seatMatrix) {
        for (const cell of row || []) {
            if (cell && cell.type !== 'aisle') totalSeats++;
        }
    }
    return totalSeats;
}

async function loadBookingContext(bookingId) {
    return Booking.findById(bookingId)
        .populate('user', 'name email phone')
        .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title poster' },
                { path: 'cinema', select: 'name address' },
                { path: 'room', select: 'name' },
            ],
        })
        .populate('paymentId', 'method status');
}

function getTodayFloor() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

async function buildEmergencyPreview(showtimes) {
    const preview = await Promise.all(showtimes.map(async (showtime) => {
        const bookings = await Booking.find({
            showtime: showtime._id,
            status: { $in: ['pending', 'paid'] },
        });

        return {
            _id: showtime._id,
            movieTitle: showtime.movie?.title || '—',
            roomId: showtime.room?._id?.toString() || showtime.room?.toString() || '',
            roomName: showtime.room?.name || '—',
            date: showtime.date,
            startTime: showtime.startTime,
            totalBookings: bookings.length,
            paidBookings: bookings.filter((booking) => booking.status === 'paid').length,
        };
    }));

    return {
        totalShowtimes: preview.length,
        totalBookings: preview.reduce((sum, item) => sum + item.totalBookings, 0),
        totalRefunds: preview.reduce((sum, item) => sum + item.paidBookings, 0),
        showtimes: preview,
    };
}

async function cancelShowtimesAndRefund(showtimes, reason) {
    let cancelledShowtimes = 0;
    let cancelledBookings = 0;
    let refundedBookings = 0;

    for (const showtime of showtimes) {
        showtime.status = 'cancelled';
        await showtime.save();
        cancelledShowtimes++;

        const bookings = await Booking.find({
            showtime: showtime._id,
            status: { $in: ['pending', 'paid'] },
        });
        const bookingIds = bookings.map((booking) => booking._id);
        const seatIds = bookings.flatMap((booking) => booking.seats);

        await Seat.updateMany(
            { _id: { $in: seatIds } },
            { status: 'available', bookedBy: null }
        );
        await Booking.updateMany(
            { _id: { $in: bookingIds } },
            { status: 'cancelled' }
        );
        cancelledBookings += bookings.length;

        const paidIds = bookings
            .filter((booking) => booking.status === 'paid')
            .map((booking) => booking._id);

        if (paidIds.length > 0) {
            // Update payments and bookings first (fast DB ops)
            await Payment.updateMany(
                { booking: { $in: paidIds }, status: 'success' },
                {
                    $set: {
                        status: 'refunded',
                        refundDate: new Date(),
                        refundAmount: 0,
                    },
                }
            );
            await Booking.updateMany(
                { _id: { $in: paidIds } },
                { status: 'refunded' }
            );
            refundedBookings += paidIds.length;

            // Send notification emails in parallel to avoid long blocking loops
            const emailPromises = [];
            for (const paidId of paidIds) {
                const p = loadBookingContext(paidId)
                    .then((bookingContext) => Promise.allSettled([
                        sendShowtimeCancelledEmail(bookingContext, reason),
                        sendRefundEmail(bookingContext, reason || 'Suất chiếu bị hủy'),
                    ])).catch((e) => console.error('Failed to prepare/send emails for booking', paidId, e.message));
                emailPromises.push(p);
            }
            // wait for emails to be scheduled/attempted but don't fail the whole flow if they error
            await Promise.allSettled(emailPromises);
        }
    }

    if (cancelledShowtimes > 0) {
        notificationService.createNotification({
            type: 'showtime_cancelled',
            title: 'Đóng khẩn cấp / hủy suất chiếu',
            message: `Đã hủy ${cancelledShowtimes} suất chiếu, hoàn ${refundedBookings} đơn`,
            data: {
                cancelledShowtimes,
                refundedBookings,
            },
        });
    }

    return {
        cancelledShowtimes,
        cancelledBookings,
        refundedBookings,
    };
}

// Faster variant: perform DB updates (cancel showtimes, free seats, mark bookings/payments)
// and return counts + list of paid booking ids. Email sending/refund notifications
// will be executed asynchronously by the caller to avoid long HTTP request times.
async function cancelShowtimesDbUpdates(showtimes, reason) {
    let cancelledShowtimes = 0;
    let cancelledBookings = 0;
    let refundedBookings = 0;
    const paidBookingIds = [];

    for (const showtime of showtimes) {
        showtime.status = 'cancelled';
        await showtime.save();
        cancelledShowtimes++;

        const bookings = await Booking.find({
            showtime: showtime._id,
            status: { $in: ['pending', 'paid'] },
        });
        const bookingIds = bookings.map((b) => b._id);
        const seatIds = bookings.flatMap((b) => b.seats);

        await Seat.updateMany({ _id: { $in: seatIds } }, { status: 'available', bookedBy: null });
        await Booking.updateMany({ _id: { $in: bookingIds } }, { status: 'cancelled' });
        cancelledBookings += bookings.length;

        const paidIds = bookings.filter((b) => b.status === 'paid').map((b) => b._id);
        if (paidIds.length > 0) {
            // mark payments/bookings refunded
            await Payment.updateMany(
                { booking: { $in: paidIds }, status: 'success' },
                { $set: { status: 'refunded', refundDate: new Date(), refundAmount: 0 } }
            );
            await Booking.updateMany({ _id: { $in: paidIds } }, { status: 'refunded' });
            refundedBookings += paidIds.length;
            paidBookingIds.push(...paidIds.map((id) => id.toString()));
        }
    }

    if (cancelledShowtimes > 0) {
        notificationService.createNotification({
            type: 'showtime_cancelled',
            title: 'Đóng khẩn cấp / hủy suất chiếu',
            message: `Đã hủy ${cancelledShowtimes} suất chiếu, hoàn ${refundedBookings} đơn`,
            data: { cancelledShowtimes, refundedBookings },
        });
    }

    return { cancelledShowtimes, cancelledBookings, refundedBookings, paidBookingIds };
}

router.get('/cinemas', async (req, res) => {
    try {
        const cinemas = await Cinema.find({});
        res.json(cinemas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/cinemas', protect, admin, async (req, res) => {
    try {
        const cinema = new Cinema(req.body);
        await cinema.save();
        res.status(201).json(cinema);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/cinemas/:id', protect, admin, async (req, res) => {
    try {
        const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cinema) return res.status(404).json({ message: 'Cinema not found' });
        res.json(cinema);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/cinemas/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'incident', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid cinema status' });
        }

        const cinema = await Cinema.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!cinema) return res.status(404).json({ message: 'Cinema not found' });

        notificationService.createNotification({
            type: 'cinema_status',
            title: 'Cập nhật trạng thái rạp',
            message: `${cinema.name} chuyển sang trạng thái ${status}`,
            data: { cinemaId: cinema._id.toString(), status },
        });

        console.log('[admin] Cinema status change requested:', cinema._id.toString(), '->', status);
        // Cascade to all rooms: active → all rooms active, incident → all rooms maintenance
        try {
            const roomStatus = status === 'active' ? 'active' : 'maintenance';
            await CinemaRoom.updateMany({ cinema: cinema._id }, { status: roomStatus });
        } catch (err) {
            console.error('Failed to update room statuses for cinema:', cinema._id, err.message);
        }

        // When setting to incident (maintenance), cancel all upcoming showtimes and refund
        let cancelResult = null;
        if (status === 'incident') {
            await expireShowtimes();
            const showtimes = await Showtime.find({
                cinema: cinema._id,
                status: 'active',
                date: { $gte: getTodayFloor() },
            });

            if (showtimes.length > 0) {
                cancelResult = await cancelShowtimesDbUpdates(showtimes, 'Rạp tạm thời bảo trì');

                // Fire-and-forget background emails
                (async () => {
                    for (const paidId of cancelResult.paidBookingIds) {
                        try {
                            const bookingContext = await loadBookingContext(paidId);
                            await sendShowtimeCancelledEmail(bookingContext, 'Rạp tạm thời bảo trì');
                            await sendRefundEmail(bookingContext, 'Rạp tạm thời bảo trì');
                        } catch (e) {
                            console.error('Failed to send emails for booking', paidId, e.message);
                        }
                    }
                })();
            }
        }

        res.json({ ...cinema.toObject(), ...(cancelResult || {}) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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

        // Mark the selected rooms as maintenance
        await CinemaRoom.updateMany({ _id: { $in: roomIds } }, { status: 'maintenance' });

        // Only set cinema to incident if ALL rooms are now in maintenance
        const allRooms = await CinemaRoom.find({ cinema: cinemaId });
        const anyActive = allRooms.some((r) => r.status === 'active');
        if (!anyActive) {
            await Cinema.findByIdAndUpdate(cinemaId, { status: 'incident' });
            console.log('[admin] Cinema marked incident (all rooms in maintenance):', cinemaId);
        }

        // Do DB updates now and return quickly; process emails/refunds in background.
        console.log('[admin] Performing DB updates for showtimes count:', showtimes.length);
        const dbResult = await cancelShowtimesDbUpdates(showtimes, 'Phòng chiếu gặp sự cố khẩn cấp');

        console.log('[admin] DB updates done, scheduling background email tasks for paid bookings:', dbResult.paidBookingIds.length);
        // Fire-and-forget async email/refund notifications
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

        res.json({
            message: 'Selected rooms emergency closed',
            roomIds,
            ...dbResult,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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

router.post('/emergency-close/:id', protect, admin, async (req, res) => {
    try {
        await expireShowtimes();
        const showtimes = await Showtime.find({
            cinema: req.params.id,
            status: 'active',
            date: { $gte: getTodayFloor() },
        });

        await Cinema.findByIdAndUpdate(req.params.id, { status: 'incident' });

        // DB updates first
        const dbResult = await cancelShowtimesDbUpdates(showtimes, 'Rạp gặp sự cố khẩn cấp');

        // background email/refund notifications
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

router.post('/rooms/reopen', protect, admin, async (req, res) => {
    try {
        const { cinemaId, roomIds = [] } = req.body || {};
        if (!cinemaId) return res.status(400).json({ message: 'Cinema ID is required' });
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            return res.status(400).json({ message: 'Select at least one room' });
        }

        await CinemaRoom.updateMany({ _id: { $in: roomIds } }, { status: 'active' });

        // If all rooms in the cinema are now active, restore cinema status to active
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

router.get('/cinemas/:cinemaId/rooms', protect, admin, async (req, res) => {
    try {
        const rooms = await CinemaRoom.find({ cinema: req.params.cinemaId });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/rooms', protect, admin, async (req, res) => {
    try {
        const payload = { ...req.body };
        payload.totalSeats = Array.isArray(payload.seatMatrix) && payload.seatMatrix.length > 0
            ? countSeatsFromMatrix(payload.seatMatrix)
            : Number(payload.rows) * Number(payload.cols);

        const room = new CinemaRoom(payload);
        await room.save();
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/rooms/:id', protect, admin, async (req, res) => {
    try {
        const room = await CinemaRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const { name, rows, cols, roomType, status, seatMatrix } = req.body;
        if (name) room.name = name;
        if (rows) room.rows = rows;
        if (cols) room.cols = cols;
        if (roomType) room.roomType = roomType;
        if (status) room.status = status;
        if (seatMatrix !== undefined) {
            let count = 0;
            for (const row of seatMatrix) {
                for (const cell of row) {
                    if (cell && cell.type !== 'aisle') count++;
                }
            }
            room.seatMatrix = seatMatrix;
            room.totalSeats = count || room.rows * room.cols;
        }

        await room.save();
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/bookings/:id/print', protect, admin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Only paid bookings can be printed' });

        booking.ticketStatus = 'printed';
        await booking.save();

        // Emit real-time event so user's phone auto-updates
        ticketEvents.emit(booking._id, 'ticket_printed', {
            bookingId: booking._id.toString(),
            bookingCode: booking.bookingCode,
            ticketStatus: 'printed',
            status: booking.status,
        });

        notificationService.createNotification({
            type: 'ticket_printed',
            title: 'Vé đã được xác nhận',
            message: `Đơn ${booking.bookingCode} đã được đánh dấu in vé`,
            data: {
                bookingId: booking._id.toString(),
                bookingCode: booking.bookingCode,
            },
        });

        res.json({ message: 'Ticket marked as printed', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/seats/:id/lock', protect, admin, async (req, res) => {
    try {
        const { isLocked } = req.body;
        const seat = await Seat.findByIdAndUpdate(
            req.params.id,
            { isLocked: !!isLocked },
            { new: true }
        );
        if (!seat) return res.status(404).json({ message: 'Seat not found' });
        res.json(seat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/bookings', protect, admin, async (req, res) => {
    try {
        const bookings = await Booking.find({})
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie' },
                    { path: 'cinema' },
                    { path: 'room', select: 'name' },
                ],
            })
            .populate('user', 'name email phone')
            .populate('paymentId', 'method status')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/bookings/:id/confirm', protect, admin, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status === 'paid') return res.status(400).json({ message: 'Already paid' });

        booking.status = 'paid';
        await booking.save();

        if (booking.paymentId) {
            await Payment.findByIdAndUpdate(booking.paymentId, {
                status: 'success',
                paymentDate: new Date(),
            });
        }
        await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'booked' });

        const bookingContext = await loadBookingContext(booking._id);
        await sendPaymentSuccessEmail(bookingContext, 'cash');
        notificationService.createNotification({
            type: 'payment_paid',
            title: 'Thanh toán tại quầy thành công',
            message: `${bookingContext?.user?.name || 'Khách hàng'} đã thanh toán đơn ${bookingContext?.bookingCode}`,
            data: {
                bookingId: bookingContext?._id?.toString(),
                bookingCode: bookingContext?.bookingCode,
            },
        });

        res.json({ message: 'Payment confirmed', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { name, role } = req.body;
        if (name) user.name = name;
        if (role) user.role = role;
        await user.save();
        res.json(await User.findById(user._id).select('-password'));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ message: 'Khong the xoa tai khoan admin' });
        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/showtimes', protect, admin, async (req, res) => {
    try {
        await expireShowtimes();
        const showtimes = await Showtime.find({})
            .populate('movie', 'title poster duration')
            .populate('cinema', 'name')
            .populate('room', 'name')
            .sort({ date: -1, startTime: -1 });

        await Promise.all(showtimes.map(async (showtime) => {
            if (showtime.status === 'active' && isShowtimeExpired(showtime)) {
                showtime.status = 'expired';
                await showtime.save();
            }
        }));

        // Compute actual availableSeats from Seat collection (ignores stale cached value)
        const showtimeIds = showtimes.map(s => s._id);
        const seatCounts = await Seat.aggregate([
            { $match: { showtime: { $in: showtimeIds } } },
            { $group: { _id: '$showtime', available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } }, total: { $sum: 1 } } },
        ]);
        const seatMap = Object.fromEntries(seatCounts.map(s => [s._id.toString(), s]));

        const result = showtimes.map(st => {
            const obj = st.toObject();
            const counts = seatMap[st._id.toString()];
            if (counts) {
                obj.availableSeats = counts.available;
                obj.totalSeats = counts.total;
            }
            return obj;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/notifications', protect, admin, async (req, res) => {
    try {
        const items = notificationService.listNotifications();
        res.json({
            items,
            unreadCount: items.filter((item) => !item.read).length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/notifications/stream', protect, admin, async (req, res) => {
    const unsubscribe = notificationService.subscribe(res);
    req.on('close', unsubscribe);
});

router.post('/notifications/read', protect, admin, async (req, res) => {
    try {
        const { ids = [] } = req.body || {};
        const items = notificationService.markRead(ids);
        res.json({
            items,
            unreadCount: items.filter((item) => !item.read).length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reports/revenue', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const match = { status: { $in: ['paid', 'refunded'] } };
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const groupFormats = {
            day: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } },
            month: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            quarter: { year: { $year: '$createdAt' }, quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } } },
            year: { year: { $year: '$createdAt' } },
        };

        const [revenue, extras] = await Promise.all([
            Booking.aggregate([
                { $match: match },
                { $group: { _id: groupFormats[groupBy] || groupFormats.day, totalRevenue: { $sum: '$totalPrice' }, totalBookings: { $sum: 1 } } },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
            ]),
            Booking.aggregate([
                { $match: match },
                { $group: { _id: null, totalRevenue: { $sum: '$totalPrice' }, totalBookings: { $sum: 1 } } },
            ]),
        ]);

        res.json({ byPeriod: revenue, summary: extras[0] || { totalRevenue: 0, totalBookings: 0 } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reports/occupancy', protect, admin, async (req, res) => {
    try {
        const showtimes = await Showtime.find({ status: 'active' }).populate('movie', 'title');
        const occupancy = showtimes.map((showtime) => ({
            showtimeId: showtime._id,
            movie: showtime.movie?.title,
            date: showtime.date,
            startTime: showtime.startTime,
            occupied: showtime.totalSeats - showtime.availableSeats,
            total: showtime.totalSeats,
            percentage: showtime.totalSeats > 0
                ? ((showtime.totalSeats - showtime.availableSeats) / showtime.totalSeats * 100).toFixed(1)
                : '0.0',
        }));
        res.json(occupancy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reports/top-movies', protect, admin, async (req, res) => {
    try {
        const topMovies = await Booking.aggregate([
            { $match: { status: 'paid' } },
            { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtime' } },
            { $unwind: '$showtime' },
            { $lookup: { from: 'movies', localField: 'showtime.movie', foreignField: '_id', as: 'movie' } },
            { $unwind: '$movie' },
            { $group: { _id: '$movie._id', title: { $first: '$movie.title' }, poster: { $first: '$movie.poster' }, revenue: { $sum: '$totalPrice' }, bookings: { $sum: 1 } } },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
        ]);
        res.json(topMovies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reports/bookings', protect, admin, async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalPrice' } } },
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reports/refunds', protect, admin, async (req, res) => {
    try {
        const refunds = await Payment.aggregate([
            { $match: { status: 'refunded' } },
            { $group: { _id: null, totalRefunds: { $sum: 1 }, totalRefundAmount: { $sum: '$refundAmount' } } },
        ]);
        res.json(refunds[0] || { totalRefunds: 0, totalRefundAmount: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reports/combo-revenue', protect, admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const match = { status: 'paid', 'extraItems.0': { $exists: true } };
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const result = await Booking.aggregate([
            { $match: match },
            { $unwind: '$extraItems' },
            {
                $group: {
                    _id: '$extraItems.name',
                    totalQuantity: { $sum: '$extraItems.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$extraItems.price', '$extraItems.quantity'] } },
                },
            },
            { $sort: { totalRevenue: -1 } },
        ]);

        const totalComboRevenue = result.reduce((sum, item) => sum + item.totalRevenue, 0);
        res.json({ items: result, totalComboRevenue });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reports/movies-showtime', protect, admin, async (req, res) => {
    try {
        const { date } = req.query;
        const showtimeFilter = { status: 'active' };
        if (date) {
            const currentDate = new Date(date);
            showtimeFilter.date = {
                $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
                $lt: new Date(currentDate.setHours(23, 59, 59, 999)),
            };
        }

        const data = await Showtime.aggregate([
            { $match: showtimeFilter },
            {
                $group: {
                    _id: '$movie',
                    showtimeCount: { $sum: 1 },
                    totalSeats: { $sum: '$totalSeats' },
                    bookedSeats: { $sum: { $subtract: ['$totalSeats', '$availableSeats'] } },
                },
            },
            { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'movie' } },
            { $unwind: '$movie' },
            { $project: { title: '$movie.title', poster: '$movie.poster', showtimeCount: 1, totalSeats: 1, bookedSeats: 1 } },
            { $sort: { showtimeCount: -1 } },
        ]);

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reports/timeslots', protect, admin, async (req, res) => {
    try {
        const data = await Booking.aggregate([
            { $match: { status: 'paid' } },
            { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtime' } },
            { $unwind: '$showtime' },
            { $group: { _id: '$showtime.timeSlot', bookings: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } },
            { $sort: { bookings: -1 } },
        ]);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
