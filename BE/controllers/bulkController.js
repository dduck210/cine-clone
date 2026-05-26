const Movie = require('../models/Movie');
const Showtime = require('../models/Showtime');
const User = require('../models/User');
const Review = require('../models/Review');
const Voucher = require('../models/Voucher');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const { sendRefundEmail, sendShowtimeCancelledEmail } = require('../services/email-service');

/**
 * @desc    Bulk delete movies
 * @route   POST /api/movies/bulk-delete
 * @access  Private/Admin
 */
const bulkDeleteMovies = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ' });
        }

        const result = await Movie.deleteMany({ _id: { $in: ids } });
        
        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} phim thành công`,
            affectedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa phim' });
    }
};

/**
 * @desc    Bulk cancel showtimes and refund
 * @route   POST /api/showtimes/bulk-cancel
 * @access  Private/Admin
 */
const bulkCancelShowtimes = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ' });
        }

        let cancelledCount = 0;
        let totalRefundedBookings = 0;

        for (const id of ids) {
            const showtime = await Showtime.findById(id);
            if (!showtime || showtime.status === 'cancelled') continue;

            showtime.status = 'cancelled';
            await showtime.save();

            const bookings = await Booking.find({ showtime: id, status: { $in: ['pending', 'paid'] } });
            
            if (bookings.length > 0) {
                const bookingIds = bookings.map(b => b._id);
                const seatIds = bookings.flatMap(b => b.seats);

                // Free seats and cancel bookings
                await Seat.updateMany({ _id: { $in: seatIds } }, { status: 'available', bookedBy: null });
                await Booking.updateMany({ _id: { $in: bookingIds } }, { status: 'cancelled' });

                const paidBookings = bookings.filter(b => b.status === 'paid');
                for (const booking of paidBookings) {
                    // Update payment status
                    await Payment.updateMany({ booking: booking._id, status: 'success' }, {
                        $set: { status: 'refunded', refundDate: new Date(), refundAmount: booking.totalPrice }
                    });
                    
                    // Mark booking as refunded
                    await Booking.findByIdAndUpdate(booking._id, { status: 'refunded' });

                    // Send notifications
                    try {
                        const ctx = await Booking.findById(booking._id)
                            .populate('user')
                            .populate({
                                path: 'showtime',
                                populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room' }]
                            });
                        await sendShowtimeCancelledEmail(ctx, 'Hủy hàng loạt bởi quản trị viên');
                        await sendRefundEmail(ctx, 'Hủy hàng loạt bởi quản trị viên');
                    } catch (e) {
                        console.error(`Failed to send emails for booking ${booking._id}:`, e);
                    }
                }
                totalRefundedBookings += paidBookings.length;
            }
            cancelledCount++;
        }

        res.json({
            success: true,
            message: `Đã hủy ${cancelledCount} suất chiếu, hoàn tiền ${totalRefundedBookings} đơn hàng`,
            affectedCount: cancelledCount,
            refundedCount: totalRefundedBookings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi hủy suất chiếu' });
    }
};

/**
 * @desc    Bulk delete showtimes (only if no bookings)
 * @route   POST /api/showtimes/bulk-delete
 * @access  Private/Admin
 */
const bulkDeleteShowtimes = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ' });
        }

        let deletedCount = 0;
        let skippedCount = 0;

        for (const id of ids) {
            const hasBookings = await Booking.exists({ showtime: id });
            if (hasBookings) {
                skippedCount++;
                continue;
            }
            await Seat.deleteMany({ showtime: id });
            await Showtime.findByIdAndDelete(id);
            deletedCount++;
        }

        res.json({
            success: true,
            message: `Đã xóa ${deletedCount} suất chiếu. ${skippedCount > 0 ? `Bỏ qua ${skippedCount} suất đã có đơn hàng.` : ''}`,
            affectedCount: deletedCount,
            skippedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa suất chiếu' });
    }
};

/**
 * @desc    Bulk delete users (not admins)
 * @route   POST /api/admin/users/bulk-delete
 * @access  Private/Admin
 */
const bulkDeleteUsers = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ' });
        }

        const result = await User.deleteMany({
            _id: { $in: ids },
            role: { $ne: 'admin' },
            _id: { $ne: req.user._id } // Don't delete self
        });

        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} người dùng thành công`,
            affectedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa người dùng' });
    }
};

/**
 * @desc    Bulk delete reviews
 * @route   POST /api/reviews/admin/bulk-delete
 * @access  Private/Admin
 */
const bulkDeleteReviews = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ' });
        }

        const result = await Review.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} đánh giá thành công`,
            affectedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa đánh giá' });
    }
};

/**
 * @desc    Bulk delete vouchers
 * @route   POST /api/vouchers/admin/bulk-delete
 * @access  Private/Admin
 */
const bulkDeleteVouchers = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ' });
        }

        const result = await Voucher.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: `Đã xóa ${result.deletedCount} voucher thành công`,
            affectedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa voucher' });
    }
};

module.exports = {
    bulkDeleteMovies,
    bulkCancelShowtimes,
    bulkDeleteShowtimes,
    bulkDeleteUsers,
    bulkDeleteReviews,
    bulkDeleteVouchers
};
