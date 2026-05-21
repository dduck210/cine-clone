const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendEmail, sendConfirmedTicketEmail } = require('../services/email-service');
const { createTicketAccessToken, verifyTicketAccessToken } = require('../utils/ticket-access');
const ticketEvents = require('../services/ticket-event-emitter');
const { sendTicketPushNotification } = require('../services/push-service');

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

async function generateTicketPdfBuffer(booking) {
    const { seatNumbers = [], totalPrice, bookingCode } = booking;
    const showtime = booking.showtime || {};
    const movie    = showtime.movie   || {};
    const cinema   = showtime.cinema  || {};
    const roomName = showtime.room?.name || '';
    const showDate = showtime.date ? new Date(showtime.date).toLocaleDateString('vi-VN') : '';
    const showTime = showtime.startTime || '';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrBuffer = await QRCode.toBuffer(`${frontendUrl}/ticket/${bookingCode}`, { type: 'png', width: 160, margin: 1 });

    const W = 360, PAD = 20;

    // Section heights
    const HEADER_H = 46, CINEMA_H = 78, TEAR_H = 22, MOVIE_H = 130, QR_H = 150, FOOTER_H = 50;
    const H = HEADER_H + CINEMA_H + TEAR_H + MOVIE_H + QR_H + FOOTER_H;

    // Absolute section tops
    const CINEMA_TOP = HEADER_H;
    const TEAR_TOP   = CINEMA_TOP + CINEMA_H;
    const MOVIE_TOP  = TEAR_TOP + TEAR_H;
    const QR_TOP     = MOVIE_TOP + MOVIE_H;
    const FOOTER_TOP = H - FOOTER_H;

    // Palette
    const BG     = '#fdf8f0';
    const G900   = '#111827';
    const G800   = '#1f2937';
    const G500   = '#6b7280';
    const G400   = '#9ca3af';
    const BORDER = '#e5e0d5';
    const NOTCH  = '#e8e3d8';
    const REDD   = '#dc2626';

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: [W, H], margin: 0 });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Background
        doc.rect(0, 0, W, H).fill(BG);

        // Diagonal watermark
        doc.save();
        doc.fillColor('#000000').fillOpacity(0.055).font('Helvetica-Bold').fontSize(11);
        for (let r = -1; r < 7; r++) {
            for (let c = -1; c < 4; c++) {
                const wx = c * 180 + 90, wy = r * 100 + 50;
                doc.save().rotate(-28, { origin: [wx, wy] });
                doc.text('5CINE TICKET', wx - 60, wy - 7, { lineBreak: false, characterSpacing: 2 });
                doc.restore();
            }
        }
        doc.restore();

        // ── Header ──
        doc.font('Helvetica-Bold').fontSize(8).fillColor(G500)
           .text('CINEMA ENTRY PASS', 0, 18, { width: W, align: 'center', characterSpacing: 4, lineBreak: false });
        dashedLine(doc, PAD, CINEMA_TOP, W - PAD, BORDER);

        // ── Cinema block ──
        let y = CINEMA_TOP + 14;
        doc.font('Helvetica-Bold').fontSize(13).fillColor(G900)
           .text((cinema.name || '5Cine').toUpperCase(), PAD, y, { lineBreak: false });
        y += 18;
        if (roomName) {
            doc.font('Helvetica-Bold').fontSize(8).fillColor(G500)
               .text(roomName.toUpperCase(), PAD, y, { characterSpacing: 1.5, lineBreak: false });
            y += 14;
        }
        doc.font('Helvetica').fontSize(9).fillColor(G400)
           .text('Code: ' + bookingCode, PAD, y, { lineBreak: false });
        y += 13;
        doc.font('Helvetica').fontSize(9).fillColor(G400)
           .text(showDate + '   —   ' + showTime, PAD, y, { lineBreak: false });

        dashedLine(doc, PAD, TEAR_TOP, W - PAD, BORDER);

        // ── Tear line (half-circle notches + dashed centre) ──
        const TEAR_MID = TEAR_TOP + TEAR_H / 2;
        doc.save().fillColor(NOTCH).circle(-1, TEAR_MID, 13).fill().restore();
        doc.save().fillColor(NOTCH).circle(W + 1, TEAR_MID, 13).fill().restore();
        dashedLine(doc, 18, TEAR_MID, W - 18, BORDER);

        // ── Movie section ──
        y = MOVIE_TOP + 12;
        doc.font('Helvetica-Bold').fontSize(17).fillColor(G900)
           .text((movie.title || 'MOVIE').toUpperCase(), PAD, y, { width: W - PAD * 2, lineBreak: false });
        y += 28;

        const COL_W = (W - PAD * 2 - 16) / 2;
        const COL2  = PAD + COL_W + 16;

        // Row 1: Showtime | Date
        doc.font('Helvetica-Bold').fontSize(7).fillColor(G400)
           .text('SHOWTIME', PAD, y, { characterSpacing: 2, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(7).fillColor(G400)
           .text('DATE', COL2, y, { characterSpacing: 2, lineBreak: false });
        y += 10;
        doc.font('Helvetica-Bold').fontSize(12).fillColor(G800)
           .text(showTime || '---', PAD, y, { lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(12).fillColor(G800)
           .text(showDate || '---', COL2, y, { lineBreak: false });
        y += 22;

        // Row 2: Room | Seat
        doc.font('Helvetica-Bold').fontSize(7).fillColor(G400)
           .text('ROOM', PAD, y, { characterSpacing: 2, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(7).fillColor(G400)
           .text('SEAT', COL2, y, { characterSpacing: 2, lineBreak: false });
        y += 10;
        doc.font('Helvetica-Bold').fontSize(12).fillColor(G800)
           .text((roomName || '---').toUpperCase(), PAD, y, { lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(18).fillColor(REDD)
           .text(seatNumbers.join(', '), COL2, y - 3, { lineBreak: false });

        // ── QR section ──
        dashedLine(doc, PAD, QR_TOP, W - PAD, BORDER);
        y = QR_TOP + 14;
        doc.font('Helvetica-Bold').fontSize(7).fillColor(G400)
           .text('SCAN QR TO VERIFY', 0, y, { width: W, align: 'center', characterSpacing: 2, lineBreak: false });
        y += 14;

        const QR_SIZE = 100;
        doc.image(qrBuffer, (W - QR_SIZE) / 2, y, { width: QR_SIZE, height: QR_SIZE });
        y += QR_SIZE + 10;
        doc.font('Helvetica-Bold').fontSize(8).fillColor(G500)
           .text(bookingCode, 0, y, { width: W, align: 'center', characterSpacing: 3.5, lineBreak: false });

        // ── Footer ──
        doc.rect(0, FOOTER_TOP, W, FOOTER_H).fill(G900);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(G400)
           .text('TOTAL PAID', PAD, FOOTER_TOP + 18, { characterSpacing: 3, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff')
           .text(Number(totalPrice || 0).toLocaleString() + ' VND',
                 0, FOOTER_TOP + 15, { width: W - PAD, align: 'right', lineBreak: false });

        doc.end();
    });
}

// Generate ticket PDF (download)
router.get('/:bookingId/pdf', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room', select: 'name' }] })
            .populate('user');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'paid') return res.status(400).json({ message: 'Booking not paid yet' });
        if (booking.ticketStatus !== 'printed') return res.status(403).json({ message: 'Vé chưa được xuất. Vui lòng chờ nhân viên rạp xác nhận.' });

        const access = await ensureTicketAccess(req, booking);
        if (!access.allowed) return res.status(access.status).json({ message: access.message });

        const pdfBuffer = await generateTicketPdfBuffer(booking);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingCode}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin gửi vé cứng (PDF) về email user
router.post('/:bookingId/hard-copy', protect, async (req, res) => {
    try {
        const user = await resolveAuthenticatedUser(req);
        if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới có thể thực hiện thao tác này' });

        const booking = await Booking.findById(req.params.bookingId)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room', select: 'name' }] })
            .populate('user', 'name email');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.ticketStatus !== 'printed') return res.status(400).json({ message: 'Vé chưa được xác nhận' });

        const pdfBuffer = await generateTicketPdfBuffer(booking);
        const result = await sendConfirmedTicketEmail(booking, pdfBuffer);

        if (result.skipped) return res.status(503).json({ message: 'Email chưa được cấu hình trên server' });

        res.json({ sent: true, to: booking.user?.email });
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

// Public ticket view — no auth, returns ticket info by bookingCode for /ticket/:bookingCode page
router.get('/view/:bookingCode', async (req, res) => {
    try {
        const code = req.params.bookingCode.trim().toUpperCase();
        const booking = await Booking.findOne({ bookingCode: code })
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room', select: 'name' }] });

        if (!booking) return res.status(404).json({ message: 'Không tìm thấy vé' });
        if (!['paid', 'refunded'].includes(booking.status)) {
            return res.status(400).json({ message: 'Vé chưa được thanh toán' });
        }

        res.json({
            bookingId: booking._id,
            bookingCode: booking.bookingCode,
            ticketStatus: booking.ticketStatus || null,
            movieTitle: booking.showtime?.movie?.title || '',
            cinemaName: booking.showtime?.cinema?.name || '',
            roomName: booking.showtime?.room?.name || '',
            showDate: booking.showtime?.date ? new Date(booking.showtime.date).toLocaleDateString('vi-VN') : '',
            showTime: booking.showtime?.startTime || '',
            seatNumbers: booking.seatNumbers || [],
            totalPrice: booking.totalPrice,
            extraItems: (booking.extraItems || []).filter(c => c.quantity > 0),
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

        // Extract booking code from URL if QR encodes /ticket/BKxxx or ?booking=xxx
        const urlMatch = bookingCode.match(/\/ticket\/([A-Za-z0-9]+)/i)
                      || bookingCode.match(/[?&]booking=([A-Za-z0-9]+)/);
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

            sendTicketPushNotification(booking).catch(err =>
                console.error('[push] notification failed:', err.message)
            );
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
