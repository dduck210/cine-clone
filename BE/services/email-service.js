const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

let transporter;

function isEmailConfigured() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function getTransporter() {
    if (!isEmailConfigured()) return null;
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }
    return transporter;
}

function getFrontendUrl() {
    return process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
}

function getServerUrl() {
    return process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
}

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString('vi-VN');
}

function formatShowtime(booking) {
    const showtime = booking?.showtime;
    const dateText = showtime?.date ? new Date(showtime.date).toLocaleDateString('vi-VN') : '---';
    const timeText = showtime?.startTime || '---';
    const roomText = showtime?.room?.name ? ` - ${showtime.room.name}` : '';
    return `${dateText} ${timeText}${roomText}`;
}

async function sendEmail({ to, subject, html, attachments = [] }) {
    if (!to) return { skipped: true, reason: 'missing_recipient' };

    const mailer = getTransporter();
    if (!mailer) {
        console.warn(`[email] skipped "${subject}" because email credentials are missing`);
        return { skipped: true, reason: 'not_configured' };
    }

    try {
        await mailer.sendMail({
            from: `"5Cine" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments,
        });
        return { sent: true };
    } catch (error) {
        console.error('[email] send failed:', error.message);
        return { sent: false, error: error.message };
    }
}

function wrapEmail(title, bodyHtml) {
    return `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px">
            <h2 style="margin:0 0 8px;color:#dc2626">5Cine</h2>
            <h3 style="margin:0 0 20px;color:#111827">${title}</h3>
            <div style="color:#374151;line-height:1.6;font-size:14px">
                ${bodyHtml}
            </div>
        </div>
    `;
}

async function sendPaymentSuccessEmail(booking, paymentMethod = '') {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const cinemaName = booking?.showtime?.cinema?.name || '5Cine';
    const rawMethod = paymentMethod || booking?.paymentId?.method || '';
    const methodLabel = rawMethod === 'momo' ? 'MoMo' : rawMethod === 'qr' ? 'QR Banking' : rawMethod || 'Online';
    const qrBuffer = await QRCode.toBuffer(booking.bookingCode, { width: 200, margin: 2 });

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Thanh toán thành công cho đơn ${booking.bookingCode}`,
        attachments: [{ filename: 'qr.png', content: qrBuffer, cid: 'ticket-qr' }],
        html: wrapEmail(
            'Thanh toán thành công',
            `
                <p>Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>, đơn vé của bạn đã được thanh toán thành công.</p>
                <p><strong>Mã đơn:</strong> ${booking.bookingCode}<br/>
                <strong>Phim:</strong> ${movieTitle}<br/>
                <strong>Rạp:</strong> ${cinemaName}<br/>
                <strong>Suất chiếu:</strong> ${formatShowtime(booking)}<br/>
                <strong>Ghế:</strong> ${(booking?.seatNumbers || []).join(', ') || '---'}<br/>
                <strong>Tổng tiền:</strong> ${formatCurrency(booking?.totalPrice)} đ<br/>
                <strong>Phương thức:</strong> ${methodLabel}</p>
                <div style="margin:20px 0;text-align:center">
                    <img src="cid:ticket-qr" alt="QR vé" style="width:180px;height:180px;border:1px solid #e5e7eb;border-radius:8px;padding:8px"/>
                    <p style="margin:10px 0 4px;font-weight:700;color:#111827">Mã QR vé của bạn</p>
                    <p style="margin:0;color:#6b7280;font-size:13px">Xuất trình mã QR này tại quầy — nhân viên rạp sẽ quét để xác nhận và in vé cho bạn.</p>
                </div>
            `
        ),
    });
}

async function sendShowtimeReminderEmail(booking) {
    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Nhắc lịch chiếu cho đơn ${booking.bookingCode}`,
        html: wrapEmail(
            'Nhắc lịch chiếu trong 24 giờ tới',
            `
                <p>Đây là lời nhắc cho vé phim của <strong>${booking?.user?.name || 'bạn'}</strong>.</p>
                <p><strong>Mã đơn:</strong> ${booking.bookingCode}<br/>
                <strong>Suất chiếu:</strong> ${formatShowtime(booking)}<br/>
                <strong>Rạp:</strong> ${booking?.showtime?.cinema?.name || '5Cine'}<br/>
                <strong>Ghế:</strong> ${(booking?.seatNumbers || []).join(', ') || '---'}</p>
                <p>Vui lòng đến rạp sớm để làm thủ tục thuận tiện hơn.</p>
            `
        ),
    });
}

async function sendRefundEmail(booking, reason) {
    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Hoàn tiền cho đơn ${booking.bookingCode}`,
        html: wrapEmail(
            'Đơn vé đã được hoàn tiền',
            `
                <p>Đơn vé của <strong>${booking?.user?.name || 'bạn'}</strong> đã được hoàn tiền.</p>
                <p><strong>Mã đơn:</strong> ${booking.bookingCode}<br/>
                <strong>Phim:</strong> ${booking?.showtime?.movie?.title || 'Phim'}<br/>
                <strong>Suất chiếu:</strong> ${formatShowtime(booking)}<br/>
                <strong>Số tiền hoàn:</strong> ${formatCurrency(booking?.totalPrice)} đ</p>
                <p><strong>Lý do:</strong> ${reason || 'Hệ thống cập nhật trạng thái hoàn tiền'}.</p>
            `
        ),
    });
}

async function sendShowtimeCancelledEmail(booking, reason) {
    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Suất chiếu đã bị hủy cho đơn ${booking.bookingCode}`,
        html: wrapEmail(
            'Suất chiếu đã bị hủy',
            `
                <p>Rất tiếc, suất chiếu trong đơn <strong>${booking.bookingCode}</strong> đã bị hủy.</p>
                <p><strong>Phim:</strong> ${booking?.showtime?.movie?.title || 'Phim'}<br/>
                <strong>Rạp:</strong> ${booking?.showtime?.cinema?.name || '5Cine'}<br/>
                <strong>Suất chiếu:</strong> ${formatShowtime(booking)}</p>
                <p><strong>Lý do:</strong> ${reason || 'Rạp cần điều chỉnh lịch chiếu'}.</p>
                <p>Nếu đơn đã thanh toán, hệ thống sẽ tự động hoàn tiền cho bạn.</p>
            `
        ),
    });
}

async function sendAdminPaymentNotificationEmail(booking, paymentMethod = '') {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const cinemaName = booking?.showtime?.cinema?.name || '5Cine';
    const methodLabel = paymentMethod === 'momo' ? 'MoMo' : paymentMethod === 'qr' ? 'QR Banking' : paymentMethod || 'Online';

    return sendEmail({
        to: adminEmail,
        subject: `[5Cine] Đơn ${booking.bookingCode} vừa được thanh toán`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
                <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900">5Cine</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Thông báo thanh toán mới</p>
                </div>
                <div style="background:#fff;padding:28px 24px">
                    <p style="color:#374151;font-size:15px;margin:0 0 16px">Có đơn đặt vé mới vừa được thanh toán thành công.</p>
                    <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:14px;color:#374151;line-height:2">
                        <div><span style="color:#6b7280">Khách hàng:</span> <strong>${booking?.user?.name || 'N/A'}</strong> (${booking?.user?.email || 'N/A'})</div>
                        <div><span style="color:#6b7280">Mã đơn:</span> <strong style="color:#dc2626">${booking.bookingCode}</strong></div>
                        <div><span style="color:#6b7280">Phim:</span> <strong>${movieTitle}</strong></div>
                        <div><span style="color:#6b7280">Rạp:</span> ${cinemaName}</div>
                        <div><span style="color:#6b7280">Suất chiếu:</span> ${formatShowtime(booking)}</div>
                        <div><span style="color:#6b7280">Ghế:</span> ${(booking?.seatNumbers || []).join(', ') || '---'}</div>
                        <div><span style="color:#6b7280">Tổng tiền:</span> <strong>${formatCurrency(booking?.totalPrice)} đ</strong></div>
                        <div><span style="color:#6b7280">Phương thức:</span> ${methodLabel}</div>
                    </div>
                </div>
            </div>
        `,
    });
}

async function sendOtpEmail(booking, otpCode) {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    return sendEmail({
        to: booking?.user?.email,
        subject: `[5Cine] Mã xác nhận thanh toán QR - ${booking?.bookingCode}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
              <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900">5Cine</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Mã xác nhận thanh toán QR</p>
              </div>
              <div style="padding:28px 24px">
                <p style="color:#374151;font-size:15px;margin:0 0 16px">Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,</p>
                <p style="color:#374151;font-size:14px;margin:0 0 20px">Hệ thống nhận được yêu cầu xác nhận thanh toán QR cho đơn <strong>${booking?.bookingCode}</strong> — phim <strong>${movieTitle}</strong>.</p>
                <div style="background:#f9fafb;border:2px dashed #dc2626;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px">
                  <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Mã xác nhận OTP</p>
                  <p style="color:#dc2626;font-size:40px;font-weight:900;letter-spacing:10px;margin:0">${otpCode}</p>
                  <p style="color:#9ca3af;font-size:12px;margin:8px 0 0">Hiệu lực trong 10 phút</p>
                </div>
                <p style="color:#9ca3af;font-size:12px;margin:0">Nếu bạn không thực hiện giao dịch này, hãy bỏ qua email này.</p>
              </div>
            </div>
        `,
    });
}

module.exports = {
    isEmailConfigured,
    sendEmail,
    sendPaymentSuccessEmail,
    sendAdminPaymentNotificationEmail,
    sendRefundEmail,
    sendShowtimeCancelledEmail,
    sendShowtimeReminderEmail,
    sendOtpEmail,
};
