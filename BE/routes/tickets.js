const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { verifyTicketPdfToken } = require('../utils/ticket-access');

const router = express.Router();

async function getOptionalUser(req) {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return null;
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.id).select('-password');
    } catch (error) {
        return null;
    }
}

// Generate ticket PDF
router.get('/:bookingId/pdf', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room' }] })
            .populate('user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Booking not paid yet' });

        const requestUser = await getOptionalUser(req);
        const hasUserAccess = requestUser && (
            requestUser.role === 'admin' ||
            requestUser._id.toString() === booking.user?._id?.toString()
        );
        const hasTokenAccess = verifyTicketPdfToken(req.query.token, booking);

        if (!hasUserAccess && !hasTokenAccess) {
            return res.status(401).json({ message: 'Not authorized to access this ticket PDF' });
        }

        const qrCode = await QRCode.toDataURL(JSON.stringify({
            bookingCode: booking.bookingCode,
            bookingId: booking._id,
            movie: booking.showtime?.movie?.title || '',
            seats: booking.seatNumbers || [],
        }));

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingCode}.pdf`);

        doc.pipe(res);
        doc.fontSize(20).text('Cinema Ticket', 100, 50);
        doc.fontSize(12).text(`Booking Code: ${booking.bookingCode}`, 100, 100);
        doc.text(`Movie: ${booking.showtime?.movie?.title || ''}`, 100, 130);
        doc.text(`Cinema: ${booking.showtime?.cinema?.name || ''}`, 100, 160);
        doc.text(`Room: ${booking.showtime?.room?.name || ''}`, 100, 190);
        doc.text(`Date: ${booking.showtime?.date ? new Date(booking.showtime.date).toLocaleDateString('vi-VN') : ''}`, 100, 220);
        doc.text(`Time: ${booking.showtime?.startTime || ''}`, 100, 250);
        doc.text(`Seats: ${(booking.seatNumbers || []).join(', ')}`, 100, 280);
        doc.text(`Total: ${booking.totalPrice.toLocaleString()}d`, 100, 310);

        if (booking.ticketStatus !== 'printed') {
            doc.fillColor('orange').text('Status: Waiting for cinema staff confirmation', 100, 340);
            doc.fillColor('black');
        }

        doc.image(qrCode, 100, 380, { width: 150 });
        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send ticket via email (placeholder)
router.post('/:bookingId/email', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] })
            .populate('user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Booking not paid yet' });

        res.json({ message: 'Ticket email sent (placeholder)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
