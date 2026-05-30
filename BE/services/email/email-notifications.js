const { sendEmail, formatShowtime, styledWrapper } = require('./email-core');

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

module.exports = { sendOtpEmail, sendShowtimeReminderEmail, sendReviewReminderEmail };
