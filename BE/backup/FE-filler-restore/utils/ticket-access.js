const jwt = require('jsonwebtoken');

function getJwtSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return process.env.JWT_SECRET;
}

function createTicketAccessToken(booking) {
    if (!booking?._id) {
        throw new Error('Booking is required to create ticket access token');
    }

    const userId = booking.user?._id?.toString?.() || booking.user?.toString?.() || null;

    return jwt.sign(
        {
            type: 'ticket_access',
            bookingId: booking._id.toString(),
            userId,
        },
        getJwtSecret(),
        {
            expiresIn: process.env.TICKET_ACCESS_EXPIRES_IN || '7d',
        }
    );
}

function verifyTicketAccessToken(token) {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload?.type !== 'ticket_access' || !payload?.bookingId) {
        throw new Error('Invalid ticket access token');
    }
    return payload;
}

module.exports = {
    createTicketAccessToken,
    verifyTicketAccessToken,
};
