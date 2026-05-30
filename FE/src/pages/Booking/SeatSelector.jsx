import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { SEAT_COLORS } from "../../shared/constants";

/**
 * SeatSelector — renders the seat grid and legend for step 1 of booking.
 * Props:
 *   rows           — array of row labels (e.g. ["A","B",..])
 *   maxCol         — number of columns
 *   seatMap        — { [seatNumber]: SeatData }
 *   selectedSeats  — array of selected seat number strings
 *   justSelected   — Set of seat numbers just toggled (for pop animation)
 *   onSeatClick    — (seatNum) => void
 *   onCoupleSeatClick — (seatNumA, seatNumB) => void
 *   loadingSeats   — boolean
 *   seatLoadError  — boolean
 *   onRetryLoad    — () => void
 *   gapError       — error string or ""
 *   showSeatInfo   — boolean
 *   onToggleSeatInfo — () => void
 *   priceConfig    — { normal, vip, couple }
 *   seatOuterRef   — ref for outer container (for scale calculation)
 *   seatInnerRef   — ref for inner container (for natural width)
 *   seatScale      — number (zoom scale 0..1)
 */
const SeatSelector = ({
  rows,
  maxCol,
  seatMap,
  selectedSeats,
  justSelected,
  onSeatClick,
  onCoupleSeatClick,
  loadingSeats,
  seatLoadError,
  onRetryLoad,
  gapError,
  showSeatInfo,
  onToggleSeatInfo,
  priceConfig,
  seatOuterRef,
  seatInnerRef,
  seatScale,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-sm p-4 sm:p-8">
      {gapError && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          <AlertTriangle size={16} />{gapError}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-700 dark:text-gray-300">Sơ đồ ghế</h2>
        <button
          onClick={onToggleSeatInfo}
          className="flex items-center gap-1.5 text-[#dc2626] hover:text-red-700 font-bold text-xs transition-colors bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-800/30"
        >
          <Info size={14} /> Định nghĩa phòng
        </button>
      </div>

      {/* Seat grid — auto-scale to fit, pinch-zoom to enlarge */}
      <div ref={seatOuterRef} className="overflow-hidden w-full">
        <div ref={seatInnerRef} style={{ zoom: seatScale, transformOrigin: "top left" }}>
          <div className="w-full h-10 bg-slate-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-12 shadow-inner border border-slate-200 dark:border-gray-600 relative overflow-hidden min-w-[520px]">
            <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-slate-300 to-transparent opacity-50" />
            <span className="text-slate-400 dark:text-gray-400 font-bold tracking-[0.5em] text-xs uppercase">Màn hình chiếu</span>
          </div>

          {loadingSeats ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" /></div>
          ) : Object.keys(seatMap).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 font-bold mb-3">Không tải được sơ đồ ghế.</p>
              {seatLoadError && (
                <button
                  onClick={onRetryLoad}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
                >
                  Thử lại
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-center pb-4">
              <div className="flex flex-col gap-2.5 min-w-max px-2">
                {rows.map((row) => {
                  const elements = [];
                  let i = 0;
                  while (i < maxCol) {
                    const col = i + 1;
                    const seatNum = `${row}${col}`;
                    const seat = seatMap[seatNum];
                    const isMiddle = col === Math.floor(maxCol / 2);
                    if (!seat) {
                      elements.push(<div key={seatNum} className={`w-9 h-9 ${isMiddle ? "mr-8" : ""}`} />);
                      i++; continue;
                    }
                    const seatType = seat.type || "normal";
                    if (seatType === "couple") {
                      const nextSeatNum = `${row}${col + 1}`;
                      const nextSeat = seatMap[nextSeatNum];
                      if (nextSeat?.type === "couple") {
                        const colors = SEAT_COLORS.couple;
                        const isSelected = selectedSeats.includes(seatNum) || selectedSeats.includes(nextSeatNum);
                        const isUnavailable = seat.status === "reserved" || seat.status === "booked" || seat.isLocked || nextSeat.status === "reserved" || nextSeat.status === "booked" || nextSeat.isLocked;
                        elements.push(
                          <button key={`${seatNum}-couple`} disabled={isUnavailable}
                            onClick={() => onCoupleSeatClick(seatNum, nextSeatNum)}
                            title={`${seatNum} & ${nextSeatNum} - Đôi`}
                            className={`h-9 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 ${isMiddle ? "mr-8" : ""} ${isUnavailable ? colors.locked : isSelected ? `${colors.selected}${justSelected.has(seatNum) ? " animate-seatPop" : ""}` : colors.available}`}
                            style={{ width: "calc(2 * 2.25rem + 0.5rem)" }}>
                            <span>{col}</span><span className="opacity-40 text-[10px]">♥</span><span>{col + 1}</span>
                          </button>
                        );
                        i += 2; continue;
                      }
                    }
                    const colors = SEAT_COLORS[seatType] || SEAT_COLORS.normal;
                    const isSelected = selectedSeats.includes(seatNum);
                    const isUnavailable = seat.status === "reserved" || seat.status === "booked" || seat.isLocked;
                    elements.push(
                      <button key={seatNum} disabled={isUnavailable} onClick={() => onSeatClick(seatNum)}
                        title={`${seatNum} - ${colors.label} - ${(seat.price || 0).toLocaleString()}đ`}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center ${isMiddle ? "mr-8" : ""} ${isUnavailable ? colors.locked : isSelected ? `${colors.selected}${justSelected.has(seatNum) ? " animate-seatPop" : ""}` : colors.available}`}>
                        {col}
                      </button>
                    );
                    i++;
                  }
                  return (
                    <div key={row} className="flex gap-2 items-center justify-center">
                      <span className="w-5 text-slate-400 dark:text-gray-500 font-bold text-xs text-center">{row}</span>
                      {elements}
                      <span className="w-5 text-slate-400 dark:text-gray-500 font-bold text-xs text-center">{row}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8 border-t border-slate-100 dark:border-gray-700 pt-6">
        {Object.entries(SEAT_COLORS).map(([type, c]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-md ${c.dot}`} />
            <div>
              <span className="text-slate-600 dark:text-gray-400 text-xs font-medium">{c.label}</span>
              {priceConfig[type] && <span className="block text-[10px] text-slate-400 dark:text-gray-500">{priceConfig[type].toLocaleString()}đ</span>}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-gray-600 border border-slate-300 dark:border-gray-500 flex items-center justify-center"><span className="text-slate-400 dark:text-gray-400 text-[10px] font-bold">X</span></div>
          <span className="text-slate-600 dark:text-gray-400 text-xs font-medium">Đã đặt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#dc2626]" />
          <span className="text-slate-600 dark:text-gray-400 text-xs font-medium">Đang chọn</span>
        </div>
      </div>
    </div>
  );
};

export default SeatSelector;
