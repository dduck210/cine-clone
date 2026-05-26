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

function emailFooter() {
    return `
        <div style="border-top:1px solid #f3f4f6;margin-top:28px;padding-top:16px;text-align:center">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 4px">© 2025 5Cine. Tất cả các quyền được bảo lưu.</p>
            <p style="color:#9ca3af;font-size:12px;margin:0">Cần hỗ trợ? Liên hệ <a href="mailto:${process.env.EMAIL_USER || 'support@5cine.vn'}" style="color:#dc2626;text-decoration:none">${process.env.EMAIL_USER || 'support@5cine.vn'}</a></p>
        </div>`;
}

// Shared styled wrapper — red gradient header + white card + footer
function styledWrapper(subtitle, bodyHtml) {
    return `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
            <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900">5Cine</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">${subtitle}</p>
            </div>
            <div style="background:#fff;padding:28px 24px">
                ${bodyHtml}
                ${emailFooter()}
            </div>
        </div>`;
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

async function sendPaymentSuccessEmail(booking, paymentMethod = '') {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const cinemaName = booking?.showtime?.cinema?.name || '5Cine';
    const rawMethod = paymentMethod || booking?.paymentId?.method || '';
    const methodLabel = rawMethod === 'momo' ? 'MoMo' : rawMethod === 'qr' ? 'QR Banking' : rawMethod || 'Online';

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const ticketUrl = `${frontendUrl}/ticket/${booking.bookingCode}`;
    const qrBuffer = await QRCode.toBuffer(ticketUrl, { width: 200, margin: 2 });

    const body = `
        <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,</p>
        <p style="color:#374151;font-size:14px;margin:0 0 20px">Đơn vé của bạn đã được thanh toán thành công. Dưới đây là thông tin chi tiết:</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:14px;color:#374151;line-height:2">
            <div><span style="color:#6b7280">Mã đơn:</span> <strong style="color:#dc2626">${booking.bookingCode}</strong></div>
            <div><span style="color:#6b7280">Phim:</span> <strong>${movieTitle}</strong></div>
            <div><span style="color:#6b7280">Rạp:</span> ${cinemaName}</div>
            <div><span style="color:#6b7280">Suất chiếu:</span> ${formatShowtime(booking)}</div>
            <div><span style="color:#6b7280">Ghế:</span> ${(booking?.seatNumbers || []).join(', ') || '---'}</div>
            <div><span style="color:#6b7280">Tổng tiền:</span> <strong>${formatCurrency(booking?.totalPrice)} đ</strong></div>
            <div><span style="color:#6b7280">Phương thức:</span> ${methodLabel}</div>
        </div>
        <div style="margin:28px 0 8px;text-align:center">
            <p style="margin:0 0 16px;font-weight:700;color:#111827;font-size:15px">Vé điện tử của bạn</p>
            <img src="cid:ticket-qr" alt="QR" width="180" height="180" style="border:1px solid #e5e7eb;border-radius:12px;padding:8px"/>
            <p style="margin:12px 0 20px;color:#6b7280;font-size:13px">Xuất trình mã QR này tại quầy rạp — nhân viên sẽ quét để xác nhận vé.</p>
            <a href="${ticketUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">Mở vé điện tử →</a>
            <p style="margin:12px 0 0;color:#9ca3af;font-size:12px">Nhấn nút trên để xem vé trên điện thoại — vé sẽ tự cập nhật khi được xác nhận tại rạp.</p>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Thanh toán thành công cho đơn ${booking.bookingCode}`,
        html: styledWrapper('Thanh toán thành công!', body),
        attachments: [{ filename: 'qr.png', content: qrBuffer, cid: 'ticket-qr' }],
    });
}

async function sendAdminPaymentNotificationEmail(booking, paymentMethod = '') {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const cinemaName = booking?.showtime?.cinema?.name || '5Cine';
    const methodLabel = paymentMethod === 'momo' ? 'MoMo' : paymentMethod === 'qr' ? 'QR Banking' : paymentMethod || 'Online';

    const body = `
        <p style="color:#374151;font-size:14px;margin:0 0 20px">Có đơn đặt vé mới vừa được thanh toán thành công trên hệ thống. Chi tiết như sau:</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:14px;color:#374151;line-height:2">
            <div><span style="color:#6b7280">Khách hàng:</span> <strong>${booking?.user?.name || 'N/A'}</strong> (${booking?.user?.email || 'N/A'})</div>
            <div><span style="color:#6b7280">Mã đơn:</span> <strong style="color:#dc2626">${booking.bookingCode}</strong></div>
            <div><span style="color:#6b7280">Phim:</span> <strong>${movieTitle}</strong></div>
            <div><span style="color:#6b7280">Rạp:</span> ${cinemaName}</div>
            <div><span style="color:#6b7280">Suất chiếu:</span> ${formatShowtime(booking)}</div>
            <div><span style="color:#6b7280">Ghế:</span> ${(booking?.seatNumbers || []).join(', ') || '---'}</div>
            <div><span style="color:#6b7280">Tổng tiền:</span> <strong>${formatCurrency(booking?.totalPrice)} đ</strong></div>
            <div><span style="color:#6b7280">Phương thức:</span> ${methodLabel}</div>
        </div>`;

    return sendEmail({
        to: adminEmail,
        subject: `[5Cine] Đơn ${booking.bookingCode} vừa được thanh toán`,
        html: styledWrapper('Thông báo thanh toán mới', body),
    });
}

async function sendOtpEmail(booking, otpCode) {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';

    const body = `
        <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,</p>
        <p style="color:#374151;font-size:14px;margin:0 0 20px">Hệ thống nhận được yêu cầu xác nhận thanh toán QR cho đơn <strong>${booking?.bookingCode}</strong> — phim <strong>${movieTitle}</strong>. Sử dụng mã OTP bên dưới để hoàn tất thanh toán.</p>
        <div style="background:#f9fafb;border:2px dashed #dc2626;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px">
            <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Mã xác nhận OTP</p>
            <p style="color:#dc2626;font-size:40px;font-weight:900;letter-spacing:10px;margin:0" data-autofill="one-time-code">${otpCode}</p>
            <p style="color:#9ca3af;font-size:12px;margin:8px 0 0">Hiệu lực trong 10 phút</p>
        </div>
        <div style="display:none;font-size:0;line-height:0;color:transparent;max-height:0">
            @5Cine #${otpCode}
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:0">Nếu bạn không thực hiện giao dịch này, hãy bỏ qua email này.</p>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `[5Cine] Mã xác nhận thanh toán QR - ${booking?.bookingCode}`,
        html: styledWrapper('Mã xác nhận thanh toán QR', body),
    });
}

async function sendShowtimeReminderEmail(booking) {
    const body = `
        <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,</p>
        <p style="color:#374151;font-size:14px;margin:0 0 20px">Đây là lời nhắc nhở — suất chiếu trong đơn vé của bạn sẽ diễn ra trong vòng <strong>24 giờ tới</strong>. Vui lòng đến rạp sớm để làm thủ tục được thuận tiện.</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:14px;color:#374151;line-height:2">
            <div><span style="color:#6b7280">Mã đơn:</span> <strong style="color:#dc2626">${booking.bookingCode}</strong></div>
            <div><span style="color:#6b7280">Phim:</span> <strong>${booking?.showtime?.movie?.title || 'Phim'}</strong></div>
            <div><span style="color:#6b7280">Rạp:</span> ${booking?.showtime?.cinema?.name || '5Cine'}</div>
            <div><span style="color:#6b7280">Suất chiếu:</span> ${formatShowtime(booking)}</div>
            <div><span style="color:#6b7280">Ghế:</span> ${(booking?.seatNumbers || []).join(', ') || '---'}</div>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Nhắc lịch chiếu cho đơn ${booking.bookingCode}`,
        html: styledWrapper('Nhắc lịch chiếu trong 24 giờ tới', body),
    });
}

async function sendRefundEmail(booking, reason) {
    const body = `
        <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,</p>
        <p style="color:#374151;font-size:14px;margin:0 0 20px">Đơn vé của bạn đã được xử lý hoàn tiền thành công. Số tiền sẽ được hoàn về phương thức thanh toán ban đầu trong vòng 3–5 ngày làm việc.</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:14px;color:#374151;line-height:2">
            <div><span style="color:#6b7280">Mã đơn:</span> <strong style="color:#dc2626">${booking.bookingCode}</strong></div>
            <div><span style="color:#6b7280">Phim:</span> ${booking?.showtime?.movie?.title || 'Phim'}</div>
            <div><span style="color:#6b7280">Suất chiếu:</span> ${formatShowtime(booking)}</div>
            <div><span style="color:#6b7280">Số tiền hoàn:</span> <strong>${formatCurrency(booking?.totalPrice)} đ</strong></div>
            <div><span style="color:#6b7280">Lý do:</span> ${reason || 'Hệ thống cập nhật trạng thái hoàn tiền'}</div>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Hoàn tiền cho đơn ${booking.bookingCode}`,
        html: styledWrapper('Đơn vé đã được hoàn tiền', body),
    });
}

async function sendShowtimeCancelledEmail(booking, reason) {
    const body = `
        <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,</p>
        <p style="color:#374151;font-size:14px;margin:0 0 20px">Rất tiếc, suất chiếu trong đơn vé của bạn đã bị hủy. Nếu đơn đã thanh toán, hệ thống sẽ tự động hoàn tiền trong vòng 3–5 ngày làm việc.</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:14px;color:#374151;line-height:2">
            <div><span style="color:#6b7280">Mã đơn:</span> <strong style="color:#dc2626">${booking.bookingCode}</strong></div>
            <div><span style="color:#6b7280">Phim:</span> <strong>${booking?.showtime?.movie?.title || 'Phim'}</strong></div>
            <div><span style="color:#6b7280">Rạp:</span> ${booking?.showtime?.cinema?.name || '5Cine'}</div>
            <div><span style="color:#6b7280">Suất chiếu:</span> ${formatShowtime(booking)}</div>
            <div><span style="color:#6b7280">Lý do:</span> ${reason || 'Rạp cần điều chỉnh lịch chiếu'}</div>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Suất chiếu đã bị hủy cho đơn ${booking.bookingCode}`,
        html: styledWrapper('Suất chiếu đã bị hủy', body),
    });
}

async function sendConfirmedTicketEmail(booking) {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const cinemaName = booking?.showtime?.cinema?.name || '5Cine';
    const roomName = booking?.showtime?.room?.name || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const ticketUrl = `${frontendUrl}/ticket/${booking.bookingCode}`;
    const showtime = booking?.showtime;
    const dateText = showtime?.date ? new Date(showtime.date).toLocaleDateString('vi-VN') : '---';
    const timeText = showtime?.startTime || '---';
    const seats = (booking?.seatNumbers || []).join(', ') || '---';
    const combos = (booking?.extraItems || []).filter(c => c.quantity > 0);
    const watermark = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='100'%3E%3Ctext x='0' y='60' font-family='monospace' font-size='14' font-weight='900' letter-spacing='2' fill='%23000' opacity='0.07' transform='rotate(-28 90 50)'%3E5CINE%20TICKET%3C/text%3E%3C/svg%3E";
    const qrBuffer = await QRCode.toBuffer(ticketUrl, { width: 200, margin: 2 });

    const comboRows = combos.map(c =>
        `<p style="margin:3px 0 0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#1f2937">${c.quantity}&times; ${c.name}</p>`
    ).join('');

    const ticket = `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
  <tr><td align="center" style="padding:20px 0">
    <table width="360" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e0d5;border-radius:12px;overflow:hidden;background-color:#fdf8f0;background-image:url('${watermark}');background-size:180px 100px;font-family:Arial,sans-serif">

      <!-- Header -->
      <tr><td style="padding:18px 20px 16px;text-align:center;border-bottom:1px dashed #d1d5db">
        <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:5px;color:#374151;text-transform:uppercase">THẺ VÀO PHÒNG CHIẾU PHIM</p>
      </td></tr>

      <!-- Cinema info -->
      <tr><td style="padding:16px 20px;border-bottom:1px dashed #d1d5db">
        <p style="margin:0;font-size:14px;font-weight:900;color:#111827;text-transform:uppercase">${cinemaName}</p>
        ${roomName ? `<p style="margin:2px 0 0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px">${roomName}</p>` : ''}
        <p style="margin:8px 0 0;font-size:10px;color:#9ca3af">Mã ĐH: ${booking.bookingCode}</p>
        <p style="margin:2px 0 0;font-size:10px;color:#9ca3af">${dateText} — ${timeText}</p>
      </td></tr>

      <!-- Movie title -->
      <tr><td style="padding:16px 20px 4px">
        <p style="margin:0;font-size:20px;font-weight:900;color:#111827;text-transform:uppercase;line-height:1.2">${movieTitle}</p>
      </td></tr>

      <!-- 2x2 Info grid -->
      <tr><td style="padding:12px 20px 16px">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr>
            <td width="50%" style="vertical-align:top;padding-bottom:12px;padding-right:8px">
              <p style="margin:0;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:4px;font-weight:900">Suất chiếu</p>
              <p style="margin:3px 0 0;font-size:12px;font-weight:900;color:#1f2937">${timeText}</p>
            </td>
            <td width="50%" style="vertical-align:top;padding-bottom:12px">
              <p style="margin:0;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:4px;font-weight:900">Ngày chiếu</p>
              <p style="margin:3px 0 0;font-size:12px;font-weight:900;color:#1f2937">${dateText}</p>
            </td>
          </tr>
          <tr>
            <td width="50%" style="vertical-align:top;padding-right:8px">
              <p style="margin:0;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:4px;font-weight:900">Phòng</p>
              <p style="margin:3px 0 0;font-size:12px;font-weight:900;color:#1f2937;text-transform:uppercase">${roomName || '---'}</p>
            </td>
            <td width="50%" style="vertical-align:top">
              <p style="margin:0;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:4px;font-weight:900">Ghế</p>
              <p style="margin:3px 0 0;font-size:18px;font-weight:900;color:#dc2626;line-height:1">${seats}</p>
            </td>
          </tr>
        </table>
      </td></tr>

      ${combos.length ? `
      <!-- Combo -->
      <tr><td style="padding:12px 20px 14px;border-top:1px dashed #d1d5db">
        <p style="margin:0;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:4px;font-weight:900">Combo bỏng nước</p>
        ${comboRows}
      </td></tr>` : ''}

      <!-- QR section -->
      <tr><td style="padding:16px 20px;text-align:center;border-top:2px dashed #d1d5db">
        <p style="margin:0 0 10px;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:4px;font-weight:900">Quét mã để xác thực vé</p>
        <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:3px;text-transform:uppercase">Scan to Verify</p>
        <img src="cid:ticket-qr" alt="QR" width="120" height="120" style="display:block;margin:0 auto;border:1px solid #e5e0d5;padding:6px;background:#ffffff"/>
        <p style="margin:10px 0 0;font-family:monospace;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:4px;text-transform:uppercase">${booking.bookingCode}</p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#111827;padding:14px 20px">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr>
            <td style="vertical-align:middle">
              <p style="margin:0;font-size:9px;font-weight:900;color:#9ca3af;text-transform:uppercase;letter-spacing:4px">Total Paid</p>
            </td>
            <td style="vertical-align:middle;text-align:right">
              <p style="margin:0;font-family:monospace;font-size:20px;font-weight:900;color:#ffffff">${formatCurrency(booking?.totalPrice)} đ</p>
            </td>
          </tr>
        </table>
      </td></tr>

    </table>
  </td></tr>
</table>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Vé điện tử — ${movieTitle} — ${booking.bookingCode}`,
        attachments: [{ filename: 'qr.png', content: qrBuffer, cid: 'ticket-qr' }],
        html: ticket,
    });
}

async function sendReviewReminderEmail(booking) {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const movieId = booking?.showtime?.movie?._id || booking?.showtime?.movie;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const reviewUrl = `${frontendUrl}/movie/${movieId}#reviews`;

    const body = `
        <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,</p>
        <p style="color:#374151;font-size:14px;margin:0 0 20px">Bạn vừa trải nghiệm bộ phim <strong>${movieTitle}</strong> tại 5Cine. Phim có hay không? Hãy chia sẻ cảm nhận của bạn để giúp những khán giả khác có lựa chọn tốt hơn nhé!</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;font-size:14px;color:#374151;line-height:2;margin:0 0 24px">
            <div><span style="color:#6b7280">Phim:</span> <strong>${movieTitle}</strong></div>
            <div><span style="color:#6b7280">Mã đơn:</span> <strong style="color:#dc2626">${booking.bookingCode}</strong></div>
            <div><span style="color:#6b7280">Suất chiếu:</span> ${formatShowtime(booking)}</div>
        </div>
        <div style="text-align:center">
            <a href="${reviewUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">Đánh giá ngay →</a>
            <p style="margin:12px 0 0;color:#9ca3af;font-size:12px">Chỉ mất 1 phút — đánh giá của bạn rất có giá trị với cộng đồng 5Cine.</p>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Phim "${movieTitle}" có hay không? Đánh giá giúp chúng tôi nhé!`,
        html: styledWrapper('Chia sẻ cảm nhận của bạn', body),
    });
}

module.exports = {
    isEmailConfigured,
    sendEmail,
    sendPaymentSuccessEmail,
    sendAdminPaymentNotificationEmail,
    sendConfirmedTicketEmail,
    sendRefundEmail,
    sendShowtimeCancelledEmail,
    sendShowtimeReminderEmail,
    sendReviewReminderEmail,
    sendOtpEmail,
};
