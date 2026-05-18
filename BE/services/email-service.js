const nodemailer = require('nodemailer');
const { buildTicketPdfUrl } = require('../utils/ticket-access');

let transporter;

function getTransporter() {
    if (transporter) return transporter;

    if (!process.env.SMTP_HOST) {
        transporter = nodemailer.createTransport({ jsonTransport: true });
        return transporter;
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        } : undefined,
    });

    return transporter;
}

async function sendMail({ to, subject, text, html }) {
    if (!to) return null;
    const info = await getTransporter().sendMail({
        from: process.env.EMAIL_FROM || '5Cine <no-reply@5cine.local>',
        to,
        subject,
        text,
        html,
    });
    if (process.env.NODE_ENV !== 'production') console.log('[Email]', info.messageId || info.message);
    return info;
}

async function sendPaymentSuccessEmail(booking) {
    await booking.populate([
        { path: 'user', select: 'name email' },
        { path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room' }] },
    ]);

    const ticketUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success?booking=${booking.bookingCode}`;
    const pdfUrl = buildTicketPdfUrl(booking);

    return sendMail({
        to: booking.user?.email,
        subject: `5Cine - Thanh toan thanh cong ${booking.bookingCode}`,
        text: `Ve ${booking.bookingCode} da thanh toan thanh cong. Xem chi tiet: ${ticketUrl} | Tai PDF: ${pdfUrl}`,
        html: `<p>Xin chao ${booking.user?.name || ''},</p><p>Ve <strong>${booking.bookingCode}</strong> da thanh toan thanh cong.</p><p>Phim: ${booking.showtime?.movie?.title || ''}</p><p>Xem chi tiet ve: <a href="${ticketUrl}">${ticketUrl}</a></p><p>Tai ve PDF: <a href="${pdfUrl}">${pdfUrl}</a></p>`,
    });
}

async function sendShowtimeCancelledEmail(booking) {
    await booking.populate([
        { path: 'user', select: 'name email' },
        { path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room' }] },
    ]);

    return sendMail({
        to: booking.user?.email,
        subject: `5Cine - Suat chieu da huy ${booking.bookingCode}`,
        text: `Suat chieu cua ve ${booking.bookingCode} da bi huy. Don thanh toan se duoc hoan tien tu dong neu du dieu kien.`,
        html: `<p>Ve <strong>${booking.bookingCode}</strong> thuoc suat chieu ${booking.showtime?.movie?.title || ''} da bi huy.</p><p>Don thanh toan se duoc hoan tien tu dong neu du dieu kien.</p>`,
    });
}

async function sendRefundEmail(booking) {
    await booking.populate('user', 'name email');
    return sendMail({
        to: booking.user?.email,
        subject: `5Cine - Hoan tien ${booking.bookingCode}`,
        text: `Don ${booking.bookingCode} da duoc hoan tien ${booking.totalPrice.toLocaleString('vi-VN')}d.`,
        html: `<p>Don <strong>${booking.bookingCode}</strong> da duoc hoan tien <strong>${booking.totalPrice.toLocaleString('vi-VN')}d</strong>.</p>`,
    });
}

async function sendReminderEmail(booking) {
    await booking.populate([
        { path: 'user', select: 'name email' },
        { path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room' }] },
    ]);

    const pdfUrl = buildTicketPdfUrl(booking);

    return sendMail({
        to: booking.user?.email,
        subject: `5Cine - Nhac lich xem phim ${booking.bookingCode}`,
        text: `Ban co lich xem ${booking.showtime?.movie?.title || 'phim'} trong 24 gio toi. Tai PDF: ${pdfUrl}`,
        html: `<p>Ban co lich xem <strong>${booking.showtime?.movie?.title || 'phim'}</strong> trong 24 gio toi.</p><p>Tai ve PDF: <a href="${pdfUrl}">${pdfUrl}</a></p>`,
    });
}

module.exports = {
    sendMail,
    sendPaymentSuccessEmail,
    sendShowtimeCancelledEmail,
    sendRefundEmail,
    sendReminderEmail,
};
