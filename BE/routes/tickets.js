const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Generate ticket PDF
router.get('/:bookingId/pdf', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] })
            .populate('user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Booking not paid yet' });
        if (booking.ticketStatus !== 'printed') return res.status(403).json({ message: 'Vé chưa được xuất. Vui lòng chờ nhân viên rạp xác nhận.' });

        const qrCode = await QRCode.toDataURL(booking.bookingCode);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingCode}.pdf`);

        doc.pipe(res);
        doc.fontSize(20).text('Cinema Ticket', 100, 50);
        doc.fontSize(12).text(`Booking Code: ${booking.bookingCode}`, 100, 100);
        doc.text(`Movie: ${booking.showtime?.movie?.title || ''}`, 100, 130);
        doc.text(`Seats: ${booking.seatNumbers.join(', ')}`, 100, 160);
        doc.text(`Total: ${booking.totalPrice.toLocaleString()}d`, 100, 190);
        doc.image(qrCode, 100, 220, { width: 150 });
        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send ticket via email (placeholder)
router.post('/:bookingId/email', protect, async (req, res) => {
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
