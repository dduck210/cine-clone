// Official Vietnamese public holidays per Labor Code 2019 (Điều 112)
const FIXED_HOLIDAYS = [
    { month: 1, day: 1  }, // Tết Dương lịch
    { month: 4, day: 30 }, // Ngày Chiến thắng 30/4
    { month: 5, day: 1  }, // Quốc tế Lao động 1/5
    { month: 9, day: 2  }, // Quốc khánh (ngày 1)
    { month: 9, day: 3  }, // Quốc khánh (ngày 2)
];

const LUNAR_HOLIDAYS_BY_YEAR = {
    2024: [
        '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', '2024-02-13', // Tết Giáp Thìn
        '2024-04-18', // Giỗ Tổ Hùng Vương
    ],
    2025: [
        '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', // Tết Ất Tỵ
        '2025-04-07', // Giỗ Tổ Hùng Vương
    ],
    2026: [
        '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', // Tết Bính Ngọ
        '2026-04-26', // Giỗ Tổ Hùng Vương
    ],
    2027: [
        '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', // Tết Đinh Mùi
        '2027-04-16', // Giỗ Tổ Hùng Vương
    ],
    2028: [
        '2028-01-25', '2028-01-26', '2028-01-27', '2028-01-28', '2028-01-29', // Tết Mậu Thân
        '2028-04-04', // Giỗ Tổ Hùng Vương
    ],
    2029: [
        '2029-02-12', '2029-02-13', '2029-02-14', '2029-02-15', '2029-02-16', // Tết Kỷ Dậu (ước tính)
        '2029-04-24', // Giỗ Tổ Hùng Vương (ước tính)
    ],
    2030: [
        '2030-02-02', '2030-02-03', '2030-02-04', '2030-02-05', '2030-02-06', // Tết Canh Tuất (ước tính)
        '2030-04-13', // Giỗ Tổ Hùng Vương (ước tính)
    ],
};

const LUNAR_HOLIDAY_SET = new Set(Object.values(LUNAR_HOLIDAYS_BY_YEAR).flat());

export function isVietnameseHoliday(dateStr) {
    if (!dateStr) return false;
    // Normalise to Vietnam timezone (UTC+7)
    const vnDate = new Date(new Date(dateStr).getTime() + 7 * 60 * 60 * 1000);
    const month = vnDate.getUTCMonth() + 1;
    const day   = vnDate.getUTCDate();
    const year  = vnDate.getUTCFullYear();

    if (FIXED_HOLIDAYS.some(h => h.month === month && h.day === day)) return true;

    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return LUNAR_HOLIDAY_SET.has(key);
}
