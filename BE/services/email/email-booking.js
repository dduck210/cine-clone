const QRCode = require('qrcode');
const { sendEmail, emailFooter } = require('./email-core');
const { buildTicketCard } = require('./email-templates');

async function sendPaymentSuccessEmail(booking, paymentMethod = '') {
    const rawMethod = paymentMethod || booking?.paymentId?.method || '';
    const methodLabel = rawMethod === 'momo' ? 'MoMo' : rawMethod === 'qr' ? 'QR Banking' : rawMethod === 'cash' ? 'Tiền mặt' : rawMethod || 'Online';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const ticketUrl = `${frontendUrl}/ticket/${booking.bookingCode}`;
    const qrBuffer = await QRCode.toBuffer(ticketUrl, { width: 200, margin: 2 });

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 24px;text-align:center;border-radius:16px 16px 0 0">
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900">5Cine</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Thanh toán thành công!</p>
            </div>
            <div style="background:#f9fafb;padding:20px 16px;border-radius:0 0 16px 16px">
                <p style="color:#374151;font-size:14px;text-align:center;margin:0 0 4px">
                    Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,
                </p>
                <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 20px">
                    Đơn vé đã được xác nhận qua <strong>${methodLabel}</strong>. Xuất trình vé khi vào rạp.
                </p>
                ${buildTicketCard(booking)}
                <div style="text-align:center;margin-top:20px">
                    <a href="${ticketUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">Mở vé điện tử →</a>
                    <p style="margin:10px 0 0;color:#9ca3af;font-size:12px">Vé sẽ tự cập nhật khi được xác nhận tại rạp.</p>
                </div>
                ${emailFooter()}
            </div>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Thanh toán thành công cho đơn ${booking.bookingCode}`,
        html,
        attachments: [{ filename: 'qr.png', content: qrBuffer, cid: 'ticket-qr' }],
    });
}

async function sendConfirmedTicketEmail(booking) {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const ticketUrl = `${frontendUrl}/ticket/${booking.bookingCode}`;
    const qrBuffer = await QRCode.toBuffer(ticketUrl, { width: 200, margin: 2 });

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 24px;text-align:center;border-radius:16px 16px 0 0">
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900">5Cine</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Vé điện tử của bạn</p>
            </div>
            <div style="background:#f9fafb;padding:20px 16px;border-radius:0 0 16px 16px">
                <p style="color:#374151;font-size:14px;text-align:center;margin:0 0 4px">
                    Xin chào <strong>${booking?.user?.name || 'bạn'}</strong>,
                </p>
                <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 20px">
                    Vé xem phim <strong>${movieTitle}</strong> đã được xác nhận. Xuất trình vé khi vào rạp.
                </p>
                ${buildTicketCard(booking, true)}
                <div style="text-align:center;margin-top:20px">
                    <a href="${ticketUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px">Mở vé điện tử →</a>
                    <p style="margin:10px 0 0;color:#9ca3af;font-size:12px">Vé sẽ tự cập nhật khi được xác nhận tại rạp.</p>
                </div>
                ${emailFooter()}
            </div>
        </div>`;

    return sendEmail({
        to: booking?.user?.email,
        subject: `5Cine - Vé điện tử — ${movieTitle} — ${booking.bookingCode}`,
        html,
        attachments: [{ filename: 'qr.png', content: qrBuffer, cid: 'ticket-qr' }],
    });
}

module.exports = { sendPaymentSuccessEmail, sendConfirmedTicketEmail };
