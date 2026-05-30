const nodemailer = require('nodemailer');

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

module.exports = { isEmailConfigured, formatCurrency, formatShowtime, emailFooter, styledWrapper, sendEmail };
