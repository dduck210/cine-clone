const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

const CREAM = '#fdf8f0';
const DARK  = '#1a1a2e';
const RED   = '#dc2626';
const GRAY  = '#6b7280';
const LGRAY = '#9ca3af';
const BORDER = '#e0d9cc';

function dashedLine(doc, x1, y, x2) {
    const dash = 5, gap = 4;
    doc.save().strokeColor(BORDER).lineWidth(0.8);
    for (let x = x1; x < x2; x += dash + gap) {
        doc.moveTo(x, y).lineTo(Math.min(x + dash, x2), y).stroke();
    }
    doc.restore();
}

function watermark(doc, W, H) {
    doc.save().fillColor('#000').fillOpacity(0.07).fontSize(11).font('Helvetica-Bold');
    const line = '5CINE TICKET   5CINE TICKET   5CINE TICKET   ';
    for (let row = -2; row <= 12; row++) {
        doc.save().translate(W / 2, H / 2).rotate(-28).text(line, -320, row * 52 - 260, { width: 640, lineBreak: false });
        doc.restore();
    }
    doc.restore();
}

// Generate ticket PDF
router.get('/:bookingId/pdf', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room', select: 'name' }] })
            .populate('user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Booking not paid yet' });
        if (booking.ticketStatus !== 'printed') return res.status(403).json({ message: 'Vé chưa được xuất. Vui lòng chờ nhân viên rạp xác nhận.' });

        const { seatNumbers, totalPrice, bookingCode, extraItems = [] } = booking;
        const showtime = booking.showtime || {};
        const movie    = showtime.movie   || {};
        const cinema   = showtime.cinema  || {};
        const roomName = showtime.room?.name || '';
        const showDate = showtime.date ? new Date(showtime.date).toLocaleDateString('vi-VN') : '';
        const showTime = showtime.startTime || '';
        const combos   = extraItems.filter(c => c.quantity > 0);

        const W = 400;
        const doc = new PDFDocument({ size: [W, 680], margin: 0 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${bookingCode}.pdf`);
        doc.pipe(res);

        // Background
        doc.rect(0, 0, W, 680).fill(CREAM);

        // Watermark
        watermark(doc, W, 680);

        // ── HEADER ──────────────────────────────────────────
        let y = 28;
        doc.fillColor(DARK).fillOpacity(1).font('Helvetica-Bold').fontSize(11)
           .text('THE VAO PHONG CHIEU PHIM', 0, y, { width: W, align: 'center', characterSpacing: 2.5 });
        y += 30;
        dashedLine(doc, 20, y, W - 20);
        y += 14;

        // ── CINEMA INFO ──────────────────────────────────────
        doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK)
           .text((cinema.name || 'CINEMA').toUpperCase(), 28, y);
        y += 17;

        if (roomName) {
            doc.font('Helvetica').fontSize(10).fillColor(GRAY)
               .text(roomName.toUpperCase(), 28, y);
            y += 15;
        }

        doc.font('Helvetica').fontSize(9).fillColor(LGRAY)
           .text(`Ma DH: ${bookingCode}`, 28, y);
        y += 13;
        doc.text(`${showDate}  -  ${showTime}`, 28, y);
        y += 18;

        // ── TORN EDGE ────────────────────────────────────────
        doc.circle(8,  y + 10, 9).fill(BORDER);
        doc.circle(W - 8, y + 10, 9).fill(BORDER);
        dashedLine(doc, 22, y + 10, W - 22);
        y += 24;

        // ── MOVIE INFO ───────────────────────────────────────
        const title = (movie.title || 'MOVIE').toUpperCase();
        doc.font('Helvetica-Bold').fontSize(17).fillColor(DARK)
           .text(title, 28, y, { width: W - 56 });
        y += doc.heightOfString(title, { width: W - 56, fontSize: 17 }) + 14;

        // Grid: 2 columns
        const c1 = 28, c2 = W / 2 + 10;
        doc.font('Helvetica-Bold').fontSize(8).fillColor(LGRAY)
           .text('SUAT CHIEU', c1, y).text('NGAY CHIEU', c2, y);
        y += 11;
        doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK)
           .text(showTime, c1, y).text(showDate, c2, y);
        y += 20;

        doc.font('Helvetica-Bold').fontSize(8).fillColor(LGRAY);
        if (roomName) doc.text('PHONG', c1, y);
        doc.text('GHE', roomName ? c2 : c1, y);
        y += 11;

        if (roomName) {
            doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text(roomName.toUpperCase(), c1, y);
        }
        doc.font('Helvetica-Bold').fontSize(14).fillColor(RED)
           .text(seatNumbers.join(', '), roomName ? c2 : c1, y);
        y += 22;

        // F&B
        if (combos.length > 0) {
            dashedLine(doc, 28, y, W - 28);
            y += 10;
            doc.font('Helvetica-Bold').fontSize(8).fillColor(LGRAY).text('F&B / COMBO', 28, y);
            y += 12;
            combos.forEach(c => {
                doc.font('Helvetica').fontSize(10).fillColor(DARK).text(`${c.name} x${c.quantity}`, 28, y);
                doc.font('Helvetica-Bold').text(`${(c.price * c.quantity).toLocaleString()}d`, W - 120, y, { width: 90, align: 'right' });
                y += 15;
            });
            y += 4;
        }

        // ── BARCODE ──────────────────────────────────────────
        dashedLine(doc, 20, y, W - 20);
        y += 16;

        const bars = [2,3,1,4,2,1,3,2,1,2,4,1,2,3,1,1,4,2,3,1,2,3,1,4,2,1,3,1,2,4,1,2,3,2,1,4,2,1,3,2];
        const totalBW = bars.reduce((s, w) => s + w + 2.5, 0);
        let bx = (W - totalBW) / 2;
        const bH = 55;
        doc.fillColor(DARK).fillOpacity(1);
        bars.forEach(w => {
            doc.rect(bx, y, w, bH).fill(DARK);
            bx += w + 2.5;
        });
        y += bH + 8;

        doc.font('Helvetica-Bold').fontSize(10).fillColor(GRAY)
           .text(bookingCode, 0, y, { width: W, align: 'center', characterSpacing: 2 });
        y += 22;

        // ── FOOTER ───────────────────────────────────────────
        const footerY = 645;
        doc.rect(0, footerY, W, 35).fill(DARK);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(LGRAY)
           .text('TOTAL PAID', 22, footerY + 11);
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
           .text(`${totalPrice.toLocaleString()} d`, 0, footerY + 9, { width: W - 22, align: 'right' });

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
