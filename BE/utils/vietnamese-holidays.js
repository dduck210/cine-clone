// Official Vietnamese public holidays per Labor Code 2019 (Điều 112)
// Fixed solar holidays: same every year
const FIXED_HOLIDAYS = [
    { month: 1, day: 1,  name: 'Tết Dương lịch' },
    { month: 4, day: 30, name: 'Ngày Giải phóng miền Nam, thống nhất đất nước 30/4' },
    { month: 5, day: 1,  name: 'Quốc tế Lao động 1/5' },
    { month: 9, day: 2,  name: 'Quốc khánh 2/9 (ngày 1)' },
    { month: 9, day: 3,  name: 'Quốc khánh 2/9 (ngày 2)' },
];

// Lunar-based holidays: pre-computed solar dates per year
// Tết Nguyên Đán: 5 ngày = 30/12 âm (hoặc 29/12 nếu tháng thiếu) + Mùng 1–4
// Giỗ Tổ Hùng Vương: 10/3 âm lịch
// 2029–2030: ước tính, cần cập nhật khi có thông báo chính thức
const LUNAR_HOLIDAYS_BY_YEAR = {
    2024: [
        // Tết Nguyên Đán Giáp Thìn (30/12 Quý Mão + Mùng 1–4 Giáp Thìn)
        '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', '2024-02-13',
        // Giỗ Tổ Hùng Vương 10/3 âm
        '2024-04-18',
    ],
    2025: [
        // Tết Nguyên Đán Ất Tỵ (29/12 Giáp Thìn + Mùng 1–4 Ất Tỵ)
        '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01',
        // Giỗ Tổ Hùng Vương 10/3 âm
        '2025-04-07',
    ],
    2026: [
        // Tết Nguyên Đán Bính Ngọ (30/12 Ất Tỵ + Mùng 1–4 Bính Ngọ)
        '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20',
        // Giỗ Tổ Hùng Vương 10/3 âm
        '2026-04-26',
    ],
    2027: [
        // Tết Nguyên Đán Đinh Mùi (30/12 Bính Ngọ + Mùng 1–4 Đinh Mùi)
        '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09',
        // Giỗ Tổ Hùng Vương 10/3 âm
        '2027-04-16',
    ],
    2028: [
        // Tết Nguyên Đán Mậu Thân (30/12 Đinh Mùi + Mùng 1–4 Mậu Thân)
        '2028-01-25', '2028-01-26', '2028-01-27', '2028-01-28', '2028-01-29',
        // Giỗ Tổ Hùng Vương 10/3 âm
        '2028-04-04',
    ],
    2029: [
        // Tết Nguyên Đán Kỷ Dậu — ước tính (Mùng 1 ≈ 13/02/2029)
        '2029-02-12', '2029-02-13', '2029-02-14', '2029-02-15', '2029-02-16',
        // Giỗ Tổ Hùng Vương 10/3 âm — ước tính
        '2029-04-24',
    ],
    2030: [
        // Tết Nguyên Đán Canh Tuất — ước tính (Mùng 1 ≈ 03/02/2030)
        '2030-02-02', '2030-02-03', '2030-02-04', '2030-02-05', '2030-02-06',
        // Giỗ Tổ Hùng Vương 10/3 âm — ước tính
        '2030-04-13',
    ],
};

// Build a Set for O(1) lookup keyed by "YYYY-MM-DD"
const LUNAR_HOLIDAY_SET = new Set(Object.values(LUNAR_HOLIDAYS_BY_YEAR).flat());

function isVietnameseHoliday(date) {
    // Normalise to Vietnam timezone (UTC+7) to avoid cross-day errors
    const vnDate = new Date(new Date(date).getTime() + 7 * 60 * 60 * 1000);
    const month = vnDate.getUTCMonth() + 1;
    const day   = vnDate.getUTCDate();
    const year  = vnDate.getUTCFullYear();

    if (FIXED_HOLIDAYS.some(h => h.month === month && h.day === day)) return true;

    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return LUNAR_HOLIDAY_SET.has(key);
}

module.exports = { isVietnameseHoliday };
