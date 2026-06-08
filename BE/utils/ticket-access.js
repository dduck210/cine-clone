const jwt = require('jsonwebtoken');

function getJwtSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return process.env.JWT_SECRET;
}

function verifyTicketAccessToken(token) {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload?.type !== 'ticket_access' || !payload?.bookingId) {
        throw new Error('Invalid ticket access token');
    }
    return payload;
}

module.exports = {
    verifyTicketAccessToken,
};
