const TIME_SLOT_MULTIPLIERS = {
    morning: 1.0,  // before 12:00
    evening: 1.1,  // 12:00 - 18:00
    night: 1.2,    // after 18:00
};

const DAY_TYPE_MULTIPLIERS = {
    weekday: 1.0,
    weekend: 1.2,
    holiday: 1.5,
};

const SEAT_TYPE_MULTIPLIERS = {
    normal: 1.0,
    vip: 1.5,
    couple: 2.0,
};

function getTimeSlot(startTime) {
    const [hour] = startTime.split(':').map(Number);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'evening';
    return 'night';
}

function getDayTypeFromDate(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 6) return 'weekend';
    return 'weekday';
}

function calcEndTime(startTime, durationMinutes, bufferMinutes = 15) {
    const [hour, min] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + min + durationMinutes + bufferMinutes;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMin = totalMinutes % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
}

function calcPriceConfig(basePrice, timeSlot, dayType) {
    const tsm = TIME_SLOT_MULTIPLIERS[timeSlot] || 1.0;
    const dtm = DAY_TYPE_MULTIPLIERS[dayType] || 1.0;
    return {
        normal: Math.round(basePrice * SEAT_TYPE_MULTIPLIERS.normal * tsm * dtm),
        vip: Math.round(basePrice * SEAT_TYPE_MULTIPLIERS.vip * tsm * dtm),
        couple: Math.round(basePrice * SEAT_TYPE_MULTIPLIERS.couple * tsm * dtm),
    };
}

module.exports = { getTimeSlot, getDayTypeFromDate, calcEndTime, calcPriceConfig };
