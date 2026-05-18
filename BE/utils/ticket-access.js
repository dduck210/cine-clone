const jwt = require('jsonwebtoken');

function createTicketPdfToken(booking) {
    const bookingUserId = booking.user?._id?.toString?.() || booking.user?.toString?.();
    return jwt.sign(
        {
            type: 'ticket_pdf',
            bookingId: booking._id.toString(),
            userId: bookingUserId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function verifyTicketPdfToken(token, booking) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'ticket_pdf') return false;
        if (decoded.bookingId !== booking._id.toString()) return false;

        const bookingUserId = booking.user?._id?.toString?.() || booking.user?.toString?.();
        return decoded.userId === bookingUserId;
    } catch (error) {
        return false;
    }
}

function buildTicketPdfUrl(booking) {
    const token = createTicketPdfToken(booking);
    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${serverUrl}/api/tickets/${booking._id}/pdf?token=${encodeURIComponent(token)}`;
}

module.exports = {
    createTicketPdfToken,
    verifyTicketPdfToken,
    buildTicketPdfUrl,
};
