const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Seat = require('../../models/Seat');
const notificationService = require('../../services/notification-service');

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
            paidBookings: bookings.filter((b) => b.status === 'paid').length,
        };
    }));
    return {
        totalShowtimes: preview.length,
        totalBookings: preview.reduce((sum, item) => sum + item.totalBookings, 0),
        totalRefunds: preview.reduce((sum, item) => sum + item.paidBookings, 0),
        showtimes: preview,
    };
}

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

module.exports = { loadBookingContext, getTodayFloor, buildEmergencyPreview, cancelShowtimesDbUpdates };
