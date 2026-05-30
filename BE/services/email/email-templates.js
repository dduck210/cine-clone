const { formatCurrency } = require('./email-core');

// Shared ticket card used by sendPaymentSuccessEmail and sendConfirmedTicketEmail
// full=true: shows full movie info + showtime/date/room/seats (for e-ticket email)
// full=false: shows cinema info + QR only (for payment success email)
function buildTicketCard(booking, full = false) {
    const movieTitle = booking?.showtime?.movie?.title || 'Phim';
    const cinemaName = booking?.showtime?.cinema?.name || '5Cine';
    const roomName = booking?.showtime?.room?.name || '';
    const showtime = booking?.showtime;
    const dateText = showtime?.date ? new Date(showtime.date).toLocaleDateString('vi-VN') : '---';
    const timeText = showtime?.startTime || '---';
    const seats = (booking?.seatNumbers || []).join(', ') || '---';
    const combos = (booking?.extraItems || []).filter(c => c.quantity > 0);
    const watermark = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='100'%3E%3Ctext x='0' y='60' font-family='monospace' font-size='14' font-weight='900' letter-spacing='2' fill='%23000' opacity='0.07' transform='rotate(-28 90 50)'%3E5CINE%20TICKET%3C/text%3E%3C/svg%3E";
    const comboRows = combos.map(c =>
        `<p style="margin:3px 0 0;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#1f2937">${c.quantity}&times; ${c.name}</p>`
    ).join('');

    return `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
  <tr><td align="center" style="padding:20px 0">
    <table width="360" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e5e0d5;border-radius:12px;overflow:hidden;background-color:#fdf8f0;background-image:url('${watermark}');background-size:180px 100px;font-family:Arial,sans-serif">
      <tr><td style="padding:16px 20px;border-bottom:1px dashed #d1d5db">
        <p style="margin:0;font-size:14px;font-weight:900;color:#111827;text-transform:uppercase">${cinemaName}</p>
        ${roomName ? `<p style="margin:2px 0 0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:2px">${roomName}</p>` : ''}
        <p style="margin:8px 0 0;font-size:10px;color:#9ca3af">Mã ĐH: ${booking.bookingCode}</p>
        <p style="margin:2px 0 0;font-size:10px;color:#9ca3af">${dateText} — ${timeText}</p>
      </td></tr>
      ${full ? `
      <tr><td style="padding:16px 20px 4px">
        <p style="margin:0;font-size:20px;font-weight:900;color:#111827;text-transform:uppercase;line-height:1.2">${movieTitle}</p>
      </td></tr>
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
      </td></tr>` : ''}
      ${combos.length ? `
      <tr><td style="padding:12px 20px 14px;border-top:1px dashed #d1d5db">
        <p style="margin:0;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:4px;font-weight:900">Combo bỏng nước</p>
        ${comboRows}
      </td></tr>` : ''}
      <tr><td style="padding:16px 20px;text-align:center;border-top:2px dashed #d1d5db">
        <p style="margin:0 0 10px;font-size:8px;color:#9ca3af;text-transform:uppercase;letter-spacing:4px;font-weight:900">Quét mã để xác thực vé</p>
        <img src="cid:ticket-qr" alt="QR" width="120" height="120" style="display:block;margin:0 auto;border:1px solid #e5e0d5;padding:6px;background:#ffffff"/>
        <p style="margin:10px 0 0;font-family:monospace;font-size:11px;font-weight:700;color:#6b7280;letter-spacing:4px;text-transform:uppercase">${booking.bookingCode}</p>
      </td></tr>
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
}

module.exports = { buildTicketCard };
