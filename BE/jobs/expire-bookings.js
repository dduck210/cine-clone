const cron = require('node-cron');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');

// Run every minute: expire pending bookings past their 5-minute hold
function startExpireBookingsJob() {
    cron.schedule('* * * * *', async () => {
        try {
            const expiredBookings = await Booking.find({
                status: 'pending',
                expiresAt: { $lt: new Date() },
            });

            if (expiredBookings.length === 0) return;

            const bookingIds = expiredBookings.map(b => b._id);
            const seatIds = expiredBookings.flatMap(b => b.seats);

            // Release seats back to available
            await Seat.updateMany(
                { _id: { $in: seatIds } },
                { $set: { status: 'available', bookedBy: null } }
            );

            // Mark bookings as expired
            await Booking.updateMany(
                { _id: { $in: bookingIds } },
                { $set: { status: 'expired' } }
            );

            // Cancel any associated pending payments
            await Payment.updateMany(
                { booking: { $in: bookingIds }, status: 'pending' },
                { $set: { status: 'cancelled' } }
            );

            console.log(`[cron] Expired ${expiredBookings.length} booking(s)`);
        } catch (err) {
            console.error('[cron] expire-bookings error:', err.message);
        }
    });

    console.log('[cron] expire-bookings job started');
}

module.exports = { startExpireBookingsJob };
