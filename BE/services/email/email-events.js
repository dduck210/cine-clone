const { sendEmail, formatCurrency, formatShowtime, styledWrapper } = require('./email-core');

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

module.exports = { sendRefundEmail, sendShowtimeCancelledEmail };
