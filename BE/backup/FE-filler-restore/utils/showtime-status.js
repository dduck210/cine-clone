function parseTimeValue(value) {
    if (!value || typeof value !== 'string') return null;
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    return { hours, minutes };
}

function getShowtimeDateTime(showtime, useEndTime = true) {
    if (!showtime?.date) return null;

    const date = new Date(showtime.date);
    const timeValue = useEndTime ? (showtime.endTime || showtime.startTime) : showtime.startTime;
    const parsed = parseTimeValue(timeValue);

    if (!parsed) return date;

    date.setHours(parsed.hours, parsed.minutes, 0, 0);

    if (
        useEndTime &&
        showtime.endTime &&
        showtime.startTime &&
        showtime.endTime < showtime.startTime
    ) {
        date.setDate(date.getDate() + 1);
    }

    return date;
}

function isShowtimeExpired(showtime, now = new Date()) {
    if (!showtime) return false;
    if (showtime.status === 'cancelled' || showtime.status === 'expired') return showtime.status === 'expired';

    const endDateTime = getShowtimeDateTime(showtime, true);
    if (!endDateTime) return false;

    return endDateTime < now;
}

module.exports = {
    getShowtimeDateTime,
    isShowtimeExpired,
};
