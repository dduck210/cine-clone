const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');

// Create Booking
const createBooking = async (req, res) => {
    const { showtimeId, seatIds } = req.body;
    try {
        const showtime = await Showtime.findById(showtimeId).populate('movie');
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

        // Check if movie is now showing
        if (showtime.movie.status === 'coming_soon') {
            return res.status(400).json({
                message: 'Phim chưa được công chiếu, không thể đặt vé cho đến ngày ' + 
                         new Date(showtime.movie.releaseDate).toLocaleDateString('vi-VN')
            });
        }

        // Get seats and calculate price
        const seats = await Seat.find({ _id: { $in: seatIds } });
        if (seats.length !== seatIds.length) {
            return res.status(400).json({ message: 'Some seats not found' });
        }

        // Check if all seats are available
        const unavailableSeats = seats.filter(s => s.status !== 'available');
        if (unavailableSeats.length > 0) {
            return res.status(400).json({ message: 'Some seats are already booked' });
        }

        const totalPrice = seats.reduce((sum, s) => sum + s.price, 0);
        const seatNumbers = seats.map(s => s.seatNumber);

        const booking = new Booking({
            user: req.user._id,
            showtime: showtimeId,
            seats: seatIds,
            seatNumbers,
            totalPrice,
            status: 'pending',
        });

        await booking.save();

        // Update seats status to reserved
        await Seat.updateMany({ _id: { $in: seatIds } }, { status: 'reserved' });

        // Decrement available seats count
        await Showtime.findByIdAndUpdate(showtimeId, { $inc: { availableSeats: -seats.length } });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user bookings
const getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('showtime')
            .populate('seats')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get booking by ID
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('showtime')
            .populate('seats')
            .populate('user');
        if (booking) {
            res.json(booking);
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cancel booking
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'paid') {
            return res.status(400).json({ message: 'Cannot cancel paid booking' });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Release seats
        await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'available' });

        // Restore available seats count
        await Showtime.findByIdAndUpdate(booking.showtime, { $inc: { availableSeats: booking.seats.length } });

        res.json({ message: 'Booking cancelled', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createBooking, getUserBookings, getBookingById, cancelBooking };