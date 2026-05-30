// Barrel re-export — all 13 importers use this path unchanged
const { isEmailConfigured, sendEmail } = require('./email/email-core');
const { sendPaymentSuccessEmail, sendConfirmedTicketEmail } = require('./email/email-booking');
const { sendAdminPaymentNotificationEmail } = require('./email/email-admin');
const { sendOtpEmail, sendShowtimeReminderEmail, sendReviewReminderEmail } = require('./email/email-notifications');
const { sendRefundEmail, sendShowtimeCancelledEmail } = require('./email/email-events');

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
