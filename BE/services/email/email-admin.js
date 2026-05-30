const { sendEmail, formatCurrency, formatShowtime, styledWrapper } = require('./email-core');

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

module.exports = { sendAdminPaymentNotificationEmail };
