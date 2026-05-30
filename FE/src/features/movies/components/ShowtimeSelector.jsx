import React from "react";
import { Calendar, MapPin, ChevronDown } from "lucide-react";

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const toVNDateStr = (d = new Date()) =>
  new Date(+d + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
const vnDay = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDay();
const vnDate = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDate();
const vnMonth = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCMonth();

function isShowtimeLocked(showtime, now = Date.now()) {
  const lockMins = showtime.bookingLockMinutes ?? 5;
  if (!showtime.date || !showtime.startTime) return false;
  const vnDateStr = new Date(showtime.date).toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const startVN = new Date(`${vnDateStr}T${showtime.startTime}:00+07:00`);
  return now >= startVN.getTime() - lockMins * 60 * 1000;
}

/**
 * ShowtimeSelector — date tab bar + cinema accordion + showtime buttons.
 * Props:
 *   cinemaList      — array of { id, name, address, showtimes, isOpen }
 *   selectedDate    — "YYYY-MM-DD" string
 *   selectedShowtime — current selection object or null
 *   nowTick         — Date.now() value, updated every second for lock state
 *   visible         — boolean, controls fade-in animation
 *   onDateChange    — (dateStr) => void
 *   onToggleCinema  — (cinemaId) => void
 *   onSelectTime    — (showtime, cinema) => void
 */
const ShowtimeSelector = ({
  cinemaList,
  selectedDate,
  selectedShowtime,
  nowTick,
  visible,
  onDateChange,
  onToggleCinema,
  onSelectTime,
}) => {
  const onDateShowing = (cinema) =>
    cinema.showtimes.filter((st) => toVNDateStr(new Date(st.date)) === selectedDate);

  return (
    <section
      className={`pt-6 mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 border-l-4 border-[#dc2626] pl-3">Lịch chiếu</h2>
          <p className="text-slate-400 dark:text-gray-500 text-xs font-medium mt-0.5 pl-3">Chọn ngày và suất chiếu phù hợp</p>
        </div>

        {/* Date tabs — 7 days rolling window */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(+new Date() + i * 24 * 60 * 60 * 1000);
            const val = toVNDateStr(d);
            const isActive = selectedDate === val;
            return (
              <button
                key={val}
                onClick={() => onDateChange(val)}
                className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${
                  isActive
                    ? "bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600 shadow-lg scale-[1.03]"
                    : "bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-700 hover:border-slate-400 hover:text-slate-800 dark:hover:text-white hover:scale-[1.02]"
                }`}
              >
                <span className="text-[10px] uppercase tracking-wide opacity-70">{WEEKDAY[vnDay(d)]}</span>
                <span className="text-sm font-black mt-0.5">{vnDate(d)}/{vnMonth(d) + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cinema list or empty state */}
      {cinemaList.length === 0 || cinemaList.every((c) => !onDateShowing(c).length) ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
          <div className="w-14 h-14 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-gray-500">
            <Calendar size={28} />
          </div>
          <p className="text-slate-400 dark:text-gray-500 font-semibold text-sm">
            {cinemaList.length === 0
              ? "Chưa có lịch chiếu cho phim này."
              : "Không có suất chiếu trong ngày đã chọn."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {cinemaList.map((cinema) => {
            const filtered = onDateShowing(cinema);
            if (!filtered.length) return null;
            return (
              <div
                key={cinema.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300 overflow-hidden ${
                  cinema.isOpen
                    ? "border-slate-300 dark:border-gray-600 shadow-md"
                    : "border-slate-200 dark:border-gray-700 shadow-sm hover:border-slate-300 dark:hover:border-gray-600"
                }`}
              >
                {/* Cinema header — toggle accordion */}
                <button
                  className="w-full flex justify-between items-center px-5 py-4 text-left"
                  onClick={() => onToggleCinema(cinema.id)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${cinema.isOpen ? "bg-[#dc2626] text-white" : "bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-400"}`}>
                      <MapPin size={18} />
                    </div>
                    <div className="text-left">
                      <p className={`font-black text-[15px] leading-tight transition-colors ${cinema.isOpen ? "text-[#dc2626]" : "text-slate-800 dark:text-gray-200"}`}>
                        {cinema.name}
                      </p>
                      <p className="text-slate-400 dark:text-gray-500 text-xs mt-0.5 font-medium">{cinema.address}</p>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${cinema.isOpen ? "bg-red-50 dark:bg-red-900/20 text-[#dc2626] rotate-180" : "bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-400"}`}>
                    <ChevronDown size={16} />
                  </div>
                </button>

                {/* Smooth accordion via CSS grid */}
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${cinema.isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-slate-100 dark:border-gray-700 pt-4">
                      <div className="flex flex-wrap gap-2.5">
                        {filtered.map((showtime) => {
                          const isSelected = selectedShowtime?.showtimeId === showtime._id;
                          const locked = isShowtimeLocked(showtime, nowTick);
                          return (
                            <button
                              key={showtime._id}
                              onClick={() => !locked && onSelectTime(showtime, cinema)}
                              disabled={locked}
                              title={locked ? `Đã khóa đặt vé (trước ${showtime.bookingLockMinutes ?? 5} phút)` : undefined}
                              className={`flex flex-col items-center min-w-[90px] px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                                locked
                                  ? "bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-500 border-slate-200 dark:border-gray-600 cursor-not-allowed opacity-60"
                                  : isSelected
                                    ? "bg-[#dc2626] text-white border-[#dc2626] shadow-lg shadow-red-100"
                                    : "bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-600 hover:scale-[1.04] active:scale-[0.97] hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-red-50 dark:hover:bg-red-900/20"
                              }`}
                            >
                              <span className="font-black text-base">{showtime.startTime}</span>
                              <span className={`text-[10px] font-medium mt-0.5 ${
                                isSelected ? "text-red-100"
                                : locked ? "text-slate-400 dark:text-gray-500"
                                : showtime.availableSeats <= 5 ? "text-orange-500 font-bold"
                                : "text-slate-400 dark:text-gray-500"
                              }`}>
                                {locked ? "Đã khóa"
                                  : showtime.availableSeats === 0 ? "Hết ghế"
                                  : showtime.availableSeats <= 5 ? `⚡ Còn ${showtime.availableSeats} ghế`
                                  : showtime.availableSeats !== undefined ? `${showtime.availableSeats} ghế trống`
                                  : ""}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ShowtimeSelector;
