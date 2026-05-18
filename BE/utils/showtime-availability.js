const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const HO_CHI_MINH_OFFSET_HOURS = 7;

function getTimeZoneDateParts(referenceDate = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(referenceDate);
    return parts.reduce((acc, part) => {
        if (part.type !== 'literal') {
            acc[part.type] = Number(part.value);
        }
        return acc;
    }, {});
}

function createHoChiMinhDate(year, month, day, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) {
    return new Date(Date.UTC(
        year,
        month - 1,
        day,
        hours - HO_CHI_MINH_OFFSET_HOURS,
        minutes,
        seconds,
        milliseconds
    ));
}

function parseDateInput(dateInput) {
    if (typeof dateInput === 'string') {
        const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            return {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(match[3]),
            };
        }
    }

    return getTimeZoneDateParts(new Date(dateInput));
}

function getStartOfToday(referenceDate = new Date()) {
    const { year, month, day } = getTimeZoneDateParts(referenceDate);
    return createHoChiMinhDate(year, month, day);
}

function getLocalDayRange(dateInput) {
    const { year, month, day } = parseDateInput(dateInput);
    const start = createHoChiMinhDate(year, month, day);
    const end = createHoChiMinhDate(year, month, day + 1);

    return { start, end };
}

function getShowtimeStartDateTime(showtime) {
    if (!showtime?.date || !showtime?.startTime) return null;

    const { year, month, day } = getTimeZoneDateParts(new Date(showtime.date));
    const [hours = 0, minutes = 0] = String(showtime.startTime)
        .split(':')
        .map((value) => Number(value) || 0);

    return createHoChiMinhDate(year, month, day, hours, minutes);
}

function isUpcomingShowtime(showtime, referenceDate = new Date()) {
    const startAt = getShowtimeStartDateTime(showtime);
    if (!startAt) return false;
    return startAt >= referenceDate;
}

module.exports = {
    TIME_ZONE,
    getStartOfToday,
    getLocalDayRange,
    getShowtimeStartDateTime,
    isUpcomingShowtime,
};
