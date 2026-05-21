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

    // QR encodes ticket URL — user can scan to open TicketPage, admin can scan at entrance
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
            <img src="cid:ticket-qr" alt="QR vé" style="width:180px;height:180px;border:1px solid #e5e7eb;border-radius:12px;padding:8px;display:block;margin:0 auto"/>
            <p style="margin:12px 0 20px;color:#6b7280;font-size:13px">Xuất trình mã QR này tại quầy rạp — nhân viên sẽ quét để xác nhận vé.</p>
            <a href="${ticketUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">Mở vé điện tử →</a>
            <p style="margin:12px 0 0;color:#9ca3af;font-size:12px">Nhấn nút trên để xem vé trên điện thoại — vé sẽ tự cập nhật khi được xác nhận tại rạp.</p>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Thanh toán thành công cho đơn ${booking.bookingCode}`,
        attachments: [{ filename: 'qr.png', content: qrBuffer, cid: 'ticket-qr' }],
        html: styledWrapper('Thanh toán thành công', body),
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
            <p style="color:#dc2626;font-size:40px;font-weight:900;letter-spacing:10px;margin:0">${otpCode}</p>
            <p style="color:#9ca3af;font-size:12px;margin:8px 0 0">Hiệu lực trong 10 phút</p>
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

async function sendConfirmedTicketEmail(booking, _pdfBuffer) {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const cinemaName = booking?.showtime?.cinema?.name || '5Cine';
    const roomName = booking?.showtime?.room?.name || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const ticketUrl = `${frontendUrl}/ticket/${booking.bookingCode}`;
    const qrBuffer = await QRCode.toBuffer(ticketUrl, { width: 200, margin: 2 });
    const combos = (booking?.extraItems || []).filter(c => c.quantity > 0);

    const body = `
        <!-- Ticket card — mirrors PDF hard-ticket design -->
        <div style="max-width:400px;margin:0 auto;background:#fdf8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12)">
            <!-- Header -->
            <div style="padding:18px 20px 10px;text-align:center">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:#6b7280;letter-spacing:4px;text-transform:uppercase">Cinema Entry Pass</p>
            </div>
            <div style="margin:0 20px;border-top:2px dashed #e8e3d8"></div>

            <!-- Cinema info -->
            <div style="padding:14px 20px">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;font-weight:900;color:#111827;text-transform:uppercase;letter-spacing:1px">${cinemaName}</p>
                ${roomName ? '<p style="margin:2px 0 0;font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px">' + roomName + '</p>' : ''}
                <p style="margin:6px 0 0;font-family:monospace;font-size:11px;color:#9ca3af">Code: ${booking.bookingCode}</p>
                <p style="margin:2px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#9ca3af">${formatShowtime(booking)}</p>
            </div>
            <div style="margin:0 20px;border-top:2px dashed #e8e3d8"></div>

            <!-- Movie + Seats -->
            <div style="padding:14px 20px">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:3px;text-transform:uppercase">Now Showing</p>
                <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:18px;font-weight:900;color:#111827;text-transform:uppercase;line-height:1.2">${movieTitle}</p>
                <div style="display:inline-block;margin-top:8px;padding:3px 10px;background:#dc2626;border-radius:4px">
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:9px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px">Admit One</p>
                </div>
            </div>
            <div style="margin:0 20px;border-top:2px dashed #e8e3d8"></div>

            <!-- Seats + Price -->
            <div style="padding:14px 20px">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                    <tr>
                        <td style="vertical-align:top;padding-right:16px">
                            <p style="margin:0;font-family:Arial,sans-serif;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:3px;text-transform:uppercase">Seat(s)</p>
                            <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:26px;font-weight:900;color:#dc2626;line-height:1">${(booking?.seatNumbers || []).join(', ') || '---'}</p>
                        </td>
                        <td style="vertical-align:top;text-align:right">
                            <p style="margin:0;font-family:Arial,sans-serif;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:3px;text-transform:uppercase">Total</p>
                            <p style="margin:4px 0 0;font-family:monospace;font-size:22px;font-weight:900;color:#111827">${formatCurrency(booking?.totalPrice)}<span style="font-size:12px"> đ</span></p>
                        </td>
                    </tr>
                </table>
                ${combos.length ? '<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e8e3d8"><p style="margin:0;font-family:Arial,sans-serif;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase">F&B / Combo</p>' + combos.map(c => '<p style="margin:2px 0 0;font-family:Arial,sans-serif;font-size:10px;color:#6b7280">' + c.name + ' <span style="color:#9ca3af">×' + c.quantity + '</span>  <span style="float:right;font-weight:700;color:#111827">' + formatCurrency(c.price * c.quantity) + 'đ</span></p>').join('') + '</div>' : ''}
            </div>
            <div style="margin:0 20px;border-top:2px dashed #e8e3d8"></div>

            <!-- QR Code -->
            <div style="padding:16px 20px;text-align:center">
                <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:8px;font-weight:700;color:#9ca3af;letter-spacing:3px;text-transform:uppercase">Scan to Verify</p>
                <img src="cid:ticket-qr" alt="QR" style="width:130px;height:130px;border:1px solid #e5e0d5;border-radius:8px;padding:6px;background:#ffffff;display:block;margin:0 auto"/>
                <p style="margin:8px 0 0;font-family:monospace;font-size:9px;color:#9ca3af;letter-spacing:2px">${booking.bookingCode}</p>
            </div>

            <!-- Footer -->
            <div style="background:#111827;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
                <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;font-weight:900;color:#6b7280;text-transform:uppercase;letter-spacing:2px">Total Paid</p>
                <p style="margin:0;font-family:monospace;font-size:20px;font-weight:900;color:#ffffff">${formatCurrency(booking?.totalPrice)} ₫</p>
            </div>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Vé cứng điện tử — ${booking.bookingCode}`,
        attachments: [{ filename: 'qr.png', content: qrBuffer, cid: 'ticket-qr' }],
        html: styledWrapper('Vé điện tử đã xác nhận', body.replace(/^\s+|\s+$/g, '')),
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
    sendOtpEmail,
};
