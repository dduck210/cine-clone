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
            .populate({
                path: 'showtime',
                populate: [
                    { path: 'movie', select: 'title' },
                    { path: 'cinema', select: 'name' }
                ]
            })
            .populate('user', 'name email');

        if (!booking) return res.status(404).json({ message: 'Booking không tồn tại' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Booking chưa được thanh toán' });

        const qrCode = await QRCode.toDataURL(booking.bookingCode);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingCode}.pdf`);

        doc.pipe(res);
        doc.fontSize(20).text('5Cine - Vé Xem Phim', 100, 50);
        doc.fontSize(12).text(`Mã vé: ${booking.bookingCode}`, 100, 100);
        doc.text(`Phim: ${booking.showtime?.movie?.title || ''}`, 100, 130);
        doc.text(`Rạp: ${booking.showtime?.cinema?.name || ''}`, 100, 160);
        doc.text(`Ghế: ${booking.seatNumbers.join(', ')}`, 100, 190);
        doc.text(`Tổng tiền: ${booking.totalPrice.toLocaleString('vi-VN')}đ`, 100, 220);
        doc.image(qrCode, 100, 260, { width: 150 });
        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send ticket via email
router.post('/:bookingId/email', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate('showtime')
            .populate('user');

        if (!booking) return res.status(404).json({ message: 'Booking không tồn tại' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Booking chưa được thanh toán' });

        // TODO: Implement Nodemailer
        res.json({ message: 'Đã gửi vé qua email (chưa tích hợp)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
