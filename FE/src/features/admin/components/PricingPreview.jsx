import React from "react";
import { TIME_SLOT_MULTS, DAY_TYPE_MULTS, SEAT_MULTS } from "@/shared/constants";
import { isVietnameseHoliday } from "@/shared/utils/vietnamese-holidays";

function getTimeSlotFE(startTime) {
  if (!startTime) return null;
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

function getDayTypeFE(dateStr) {
  if (!dateStr) return null;
  if (isVietnameseHoliday(dateStr)) return "holiday";
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

/**
 * Compute pricing preview for all seat types given base price, time and day context.
 * Returns null when insufficient data.
 */
export function computePreview(basePrice, startTime, dayType, dateStr) {
  const bp = Number(basePrice);
  if (!bp || bp < 1000 || !startTime) return null;
  const timeSlot = getTimeSlotFE(startTime);
  const effectiveDayType = dayType || getDayTypeFE(dateStr) || "weekday";
  const tsm = TIME_SLOT_MULTS[timeSlot] || 1.0;
  const dtm = DAY_TYPE_MULTS[effectiveDayType] || 1.0;
  return {
    normal: Math.round(bp * SEAT_MULTS.normal * tsm * dtm),
    vip: Math.round(bp * SEAT_MULTS.vip * tsm * dtm),
    couple: Math.round(bp * SEAT_MULTS.couple * tsm * dtm),
    timeSlot,
    dayType: effectiveDayType,
  };
}

const TIME_LABEL = {
  morning: "Sáng ×1.0",
  afternoon: "Chiều ×1.0",
  evening: "Tối ×1.1",
  night: "Đêm ×1.2",
};

const DAY_LABEL = {
  weekday: "Ngày thường ×1.0",
  weekend: "Cuối tuần ×1.2",
  holiday: "Ngày lễ ×1.5",
};

/**
 * PricingPreview — displays computed seat prices for a showtime based on
 * base price, start time, day type and date. Renders nothing when preview
 * cannot be computed (missing/invalid inputs).
 *
 * @param {{ basePrice: string|number, startTime: string, dayType: string, date: string }} props
 */
const PricingPreview = ({ basePrice, startTime, dayType, date }) => {
  const preview = computePreview(basePrice, startTime, dayType, date);
  if (!preview) return null;

  return (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 dark:text-blue-400 mb-2">
        Giá dự tính · {TIME_LABEL[preview.timeSlot]} · {DAY_LABEL[preview.dayType]}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Thường", key: "normal", cls: "text-slate-700 dark:text-gray-300" },
          { label: "VIP ×1.5", key: "vip", cls: "text-amber-600" },
          { label: "Đôi ×2.0", key: "couple", cls: "text-pink-600" },
        ].map((p) => (
          <div key={p.key} className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center border border-blue-100 dark:border-blue-800">
            <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 mb-0.5">{p.label}</p>
            <p className={`font-black text-xs ${p.cls}`}>{preview[p.key].toLocaleString()}đ</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPreview;
