const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendEmail } = require('../services/email-service');
const { createTicketAccessToken, verifyTicketAccessToken } = require('../utils/ticket-access');
const ticketEvents = require('../services/ticket-event-emitter');

// Design tokens — mirrors electronic ticket UI
const DARK  = '#0f172a';
const WHITE = '#ffffff';
const RED   = '#dc2626';
const GOLD  = '#d4af37';
const S50   = '#f8fafc';
const S200  = '#e2e8f0';
const S400  = '#94a3b8';
const S600  = '#475569';
const R50   = '#fef2f2';
const R200  = '#fecaca';

function dashedLine(doc, x1, y, x2, color) {
    const dash = 5, gap = 4;
    doc.save().strokeColor(color || S400).lineWidth(0.7);
    for (let x = x1; x < x2; x += dash + gap) {
        doc.moveTo(x, y).lineTo(Math.min(x + dash, x2), y).stroke();
    }
    doc.restore();
}

async function resolveAuthenticatedUser(req) {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query?.token) {
        token = req.query.token;
    }

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.id).select('-password');
    } catch (error) {
        return null;
    }
}

async function ensureTicketAccess(req, booking) {
    const accessToken = req.query?.accessToken;
    if (accessToken) {
        const payload = verifyTicketAccessToken(accessToken);
        const bookingUserId = booking.user?._id?.toString?.() || booking.user?.toString?.() || null;
        if (payload.bookingId !== booking._id.toString()) {
            return { allowed: false, status: 403, message: 'Ticket link is not valid for this booking' };
        }
        if (payload.userId && bookingUserId && payload.userId !== bookingUserId) {
            return { allowed: false, status: 403, message: 'Ticket link is not valid for this user' };
        }
        return { allowed: true };
    }

    const user = await resolveAuthenticatedUser(req);
    if (!user) {
        return { allowed: false, status: 401, message: 'Not authorized, no token' };
    }

    const bookingUserId = booking.user?._id?.toString?.() || booking.user?.toString?.() || null;
    if (user.role === 'admin' || user._id.toString() === bookingUserId) {
        return { allowed: true };
    }

    return { allowed: false, status: 403, message: 'Not authorized' };
}

// Generate ticket PDF
router.get('/:bookingId/pdf', async (req, res) => {
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

        // QR code encodes admin URL for quick staff scanning
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrUrl = `${frontendUrl}/ticket/${bookingCode}`;
        const qrBuffer = await QRCode.toBuffer(qrUrl, { type: 'png', width: 120, margin: 1 });

        const W        = 400;
        const PAD      = 20;
        const HEADER_H = 112;
        const FOOTER_H = 54;
        const SEP_H    = 22;
        const QR_SIZE  = 82;

        // Dynamically calculate body height
        const COMBO_H = combos.length > 0 ? 16 + combos.length * 20 + 8 : 0;
        const BODY_H  = 18 + 62 + 62 + 72 + COMBO_H + QR_SIZE + 18;
        const H       = HEADER_H + SEP_H + BODY_H + SEP_H + FOOTER_H;

        const doc = new PDFDocument({ size: [W, H], margin: 0 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${bookingCode}.pdf`);
        doc.pipe(res);

        // ── HEADER (dark) ────────────────────────────────────
        doc.rect(0, 0, W, HEADER_H).fill(DARK);

        // Decorative gold glow (top-right)
        doc.save().fillColor(GOLD).fillOpacity(0.08)
           .circle(W - 5, 5, 74).fill()
           .restore();

        let y = 20;

        doc.font('Helvetica-Bold').fontSize(8).fillColor(GOLD)
           .text('* V.I.P ADMISSION', PAD, y, { characterSpacing: 2.5, lineBreak: false });
        y += 17;

        const titleText = (movie.title || 'MOVIE').toUpperCase();
        doc.font('Helvetica-Bold').fontSize(18).fillColor(WHITE)
           .text(titleText, PAD, y, { width: W - PAD * 2 });
        y += doc.heightOfString(titleText, { width: W - PAD * 2, fontSize: 18 }) + 8;

        // Room / format badge
        const badgeText = (roomName || '2D').toUpperCase();
        doc.save().fillColor(GOLD).fillOpacity(0.12)
           .rect(PAD, y, badgeText.length * 7 + 16, 18).fill()
           .restore();
        doc.font('Helvetica-Bold').fontSize(8).fillColor(GOLD)
           .text(badgeText, PAD + 8, y + 5, { characterSpacing: 1.5, lineBreak: false });

        // ── SEPARATOR 1 (header → body) ──────────────────────
        const sep1Y = HEADER_H;
        // Filled white zone with dark edge circles (torn-ticket look)
        doc.rect(0, sep1Y, W, SEP_H).fill(WHITE);
        doc.circle(-2, sep1Y + SEP_H / 2, SEP_H / 2 + 2).fill(DARK);
        doc.circle(W + 2, sep1Y + SEP_H / 2, SEP_H / 2 + 2).fill(DARK);
        dashedLine(doc, SEP_H + 4, sep1Y + SEP_H / 2, W - SEP_H - 4);

        // ── BODY (white) ──────────────────────────────────────
        const bodyY = HEADER_H + SEP_H;
        doc.rect(0, bodyY, W, BODY_H).fill(WHITE);

        y = bodyY + 18;

        // Cinema card
        doc.fillColor(S50).rect(PAD, y, W - PAD * 2, 50).fill();
        doc.strokeColor(S200).lineWidth(0.7).rect(PAD, y, W - PAD * 2, 50).stroke();
        doc.font('Helvetica-Bold').fontSize(8).fillColor(S400)
           .text('CINEMA', PAD + 10, y + 8, { characterSpacing: 2, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK)
           .text((cinema.name || 'CINEMA').toUpperCase(), PAD + 10, y + 24, { lineBreak: false });
        y += 62;

        // Date + Time (2-column grid)
        const colW  = (W - PAD * 2 - 10) / 2;
        const col2X = PAD + colW + 10;

        doc.fillColor(S50).rect(PAD, y, colW, 50).fill();
        doc.strokeColor(S200).lineWidth(0.7).rect(PAD, y, colW, 50).stroke();
        doc.font('Helvetica-Bold').fontSize(8).fillColor(S400)
           .text('DATE', PAD + 10, y + 8, { characterSpacing: 2, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK)
           .text(showDate, PAD + 10, y + 24, { lineBreak: false });

        doc.fillColor(S50).rect(col2X, y, colW, 50).fill();
        doc.strokeColor(S200).lineWidth(0.7).rect(col2X, y, colW, 50).stroke();
        doc.font('Helvetica-Bold').fontSize(8).fillColor(S400)
           .text('TIME', col2X + 10, y + 8, { characterSpacing: 2, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK)
           .text(showTime, col2X + 10, y + 24, { lineBreak: false });
        y += 62;

        // Seats card (red accent)
        doc.fillColor(R50).rect(PAD, y, W - PAD * 2, 60).fill();
        doc.strokeColor(R200).lineWidth(0.7).rect(PAD, y, W - PAD * 2, 60).stroke();
        doc.font('Helvetica-Bold').fontSize(8).fillColor(RED)
           .text('SEAT(S)', PAD + 10, y + 8, { characterSpacing: 2, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(22).fillColor(RED)
           .text(seatNumbers.join(', '), PAD + 10, y + 24, { lineBreak: false });
        y += 72;

        // F&B / Combos
        if (combos.length > 0) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor(S400)
               .text('F&B / COMBO', PAD, y, { characterSpacing: 2, lineBreak: false });
            y += 16;
            combos.forEach(c => {
                doc.font('Helvetica').fontSize(10).fillColor(DARK)
                   .text(`${c.name} × ${c.quantity}`, PAD, y, { lineBreak: false });
                doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
                   .text(`${(c.price * c.quantity).toLocaleString()}đ`, W - PAD - 64, y, { width: 64, align: 'right', lineBreak: false });
                y += 20;
            });
            y += 8;
        }

        // QR code + decorative barcode (side by side)
        doc.image(qrBuffer, PAD, y, { width: QR_SIZE, height: QR_SIZE });

        const bars = [2,3,1,4,2,1,3,2,1,2,4,1,2,3,1,1,4,2,3,1,2,3,1,4,2,1,3,1,2,4,1,2];
        const barcodeX    = PAD + QR_SIZE + 14;
        const barcodeW    = W - PAD - barcodeX;
        const totalBW     = bars.reduce((s, w) => s + w + 2, 0);
        const scale       = barcodeW / totalBW;
        const bH          = 44;
        let bx            = barcodeX;

        doc.save().fillOpacity(0.75);
        bars.forEach(w => {
            doc.rect(bx, y + (QR_SIZE - bH) / 2, w * scale, bH).fill(DARK);
            bx += (w + 2) * scale;
        });
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(8).fillColor(S600)
           .text(bookingCode, barcodeX, y + QR_SIZE - 14,
               { width: barcodeW, align: 'center', characterSpacing: 1.2, lineBreak: false });

        // ── SEPARATOR 2 (body → footer) ──────────────────────
        const sep2Y = bodyY + BODY_H;
        doc.rect(0, sep2Y, W, SEP_H).fill(DARK);
        doc.circle(-2, sep2Y + SEP_H / 2, SEP_H / 2 + 2).fill(WHITE);
        doc.circle(W + 2, sep2Y + SEP_H / 2, SEP_H / 2 + 2).fill(WHITE);
        dashedLine(doc, SEP_H + 4, sep2Y + SEP_H / 2, W - SEP_H - 4, S400);

        // ── FOOTER (dark) ─────────────────────────────────────
        const footerY = sep2Y + SEP_H;
        doc.rect(0, footerY, W, FOOTER_H).fill(DARK);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD)
           .text('TOTAL PAID', PAD, footerY + 20, { characterSpacing: 1.5, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(18).fillColor(WHITE)
           .text(`${totalPrice.toLocaleString()} ₫`, 0, footerY + 19,
               { width: W - PAD, align: 'right', lineBreak: false });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Send ticket via email
router.post('/:bookingId/email', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room', select: 'name' }] })
            .populate('user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        const access = await ensureTicketAccess(req, booking);
        if (!access.allowed) return res.status(access.status).json({ message: access.message });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Booking not paid yet' });

        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
        const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
        const accessToken = createTicketAccessToken(booking);
        const pdfUrl = `${serverUrl}/api/tickets/${booking._id}/pdf?accessToken=${encodeURIComponent(accessToken)}`;

        const result = await sendEmail({
            to: booking.user?.email,
            subject: `5Cine - Vé điện tử cho đơn ${booking.bookingCode}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px">
                    <h2 style="margin:0 0 8px;color:#dc2626">5Cine</h2>
                    <h3 style="margin:0 0 20px;color:#111827">Vé điện tử của bạn</h3>
                    <p>Xin chào <strong>${booking.user?.name || 'bạn'}</strong>,</p>
                    <p>Mã đơn <strong>${booking.bookingCode}</strong> đã sẵn sàng.</p>
                    <p><strong>Phim:</strong> ${booking.showtime?.movie?.title || 'Phim'}<br/>
                    <strong>Rạp:</strong> ${booking.showtime?.cinema?.name || '5Cine'}<br/>
                    <strong>Phòng:</strong> ${booking.showtime?.room?.name || '---'}<br/>
                    <strong>Ghế:</strong> ${(booking.seatNumbers || []).join(', ') || '---'}</p>
                    <p>Xem đơn hàng tại: <a href="${frontendUrl}/my-tickets">${frontendUrl}/my-tickets</a></p>
                    <p>PDF vé: <a href="${pdfUrl}">${pdfUrl}</a></p>
                </div>
            `,
        });

        res.json({
            message: result.sent ? 'Ticket email sent' : 'Ticket email skipped',
            result,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Public: get ticket info by booking code (for QR from email opening in app)
router.get('/code/:bookingCode', async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingCode: req.params.bookingCode.toUpperCase() })
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room', select: 'name' }] })
            .populate('user', 'name email phone')
            .populate('seats');

        if (!booking) return res.status(404).json({ message: 'Không tìm thấy vé' });

        res.json({
            _id: booking._id,
            bookingCode: booking.bookingCode,
            status: booking.status,
            ticketStatus: booking.ticketStatus,
            movieTitle: booking.showtime?.movie?.title || '',
            moviePoster: booking.showtime?.movie?.poster || '',
            cinemaName: booking.showtime?.cinema?.name || '',
            roomName: booking.showtime?.room?.name || '',
            showDate: booking.showtime?.date || '',
            showTime: booking.showtime?.startTime || '',
            seatNumbers: booking.seatNumbers || [],
            totalPrice: booking.totalPrice,
            combos: booking.extraItems || [],
            userName: booking.user?.name || '',
            userEmail: booking.user?.email || '',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Self-service scan: quét QR ở quầy, tự in vé, hiển thị thông tin
router.post('/scan', async (req, res) => {
    try {
        let { bookingCode } = req.body;
        if (!bookingCode) return res.status(400).json({ message: 'Thiếu mã vé' });

        bookingCode = bookingCode.trim();

        // Extract booking code from URLs (admin, ticket page, or any booking=BK... param)
        bookingCode = bookingCode.replace(/^["']|["']$/g, '');
        const urlMatch = bookingCode.match(/[?&]booking=([A-Za-z0-9]+)/);
        if (urlMatch) bookingCode = urlMatch[1];
        const pathMatch = bookingCode.match(/\/ticket\/([A-Za-z0-9]+)/);
        if (pathMatch) bookingCode = pathMatch[1];

        bookingCode = bookingCode.toUpperCase();

        if (!/^BK\d+$/i.test(bookingCode)) {
            return res.status(400).json({ message: 'Mã QR không hợp lệ. Vui lòng quét mã vé từ email hoặc ứng dụng 5Cine.' });
        }

        const booking = await Booking.findOne({ bookingCode })
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room', select: 'name' }] })
            .populate('user', 'name email phone')
            .populate('seats');

        if (!booking) return res.status(404).json({ message: 'Không tìm thấy vé với mã này' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Vé chưa được thanh toán' });

        const wasJustPrinted = booking.ticketStatus !== 'printed';
        if (wasJustPrinted) {
            booking.ticketStatus = 'printed';
            await booking.save();

            ticketEvents.emit(booking._id, 'ticket_printed', {
                bookingId: booking._id.toString(),
                bookingCode: booking.bookingCode,
                ticketStatus: 'printed',
                status: booking.status,
            });
        }

        res.json({
            message: wasJustPrinted ? 'Vé đã được in thành công!' : 'Vé đã được in trước đó',
            booking: {
                _id: booking._id,
                bookingCode: booking.bookingCode,
                status: booking.status,
                ticketStatus: booking.ticketStatus,
                movieTitle: booking.showtime?.movie?.title || '',
                cinemaName: booking.showtime?.cinema?.name || '',
                roomName: booking.showtime?.room?.name || '',
                showDate: booking.showtime?.date || '',
                showTime: booking.showtime?.startTime || '',
                seatNumbers: booking.seatNumbers || [],
                totalPrice: booking.totalPrice,
                userName: booking.user?.name || '',
                userEmail: booking.user?.email || '',
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
