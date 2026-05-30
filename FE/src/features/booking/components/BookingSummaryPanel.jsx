import React from "react";
import { MapPin, Calendar, Ticket, CreditCard, ChevronRight } from "lucide-react";

/**
 * BookingSummaryPanel — sticky right-side order summary for desktop booking flow.
 * Props:
 *   title           — movie title string
 *   cinemaName      — string
 *   showAddress     — string
 *   showDate        — formatted date string
 *   showTime        — "HH:MM" string
 *   selectedSeats   — string[]
 *   totalTicketPrice — number
 *   activeCombos    — combo objects with quantity > 0
 *   isMonday        — boolean, Gold Monday discount active
 *   finalTotalPrice — number, before Monday/voucher discounts
 *   discountedPrice — number, after Monday discount
 *   voucherDiscount — number
 *   appliedVoucher  — { code } | null
 *   priceAfterVoucher — number, final payable amount
 *   step            — 1 | 2
 *   setStep         — (step: number) => void
 *   goToPayment     — () => void
 *   navigating      — boolean
 */
const BookingSummaryPanel = ({
  title,
  cinemaName,
  showAddress,
  showDate,
  showTime,
  selectedSeats,
  totalTicketPrice,
  activeCombos,
  isMonday,
  finalTotalPrice,
  discountedPrice,
  voucherDiscount,
  appliedVoucher,
  priceAfterVoucher,
  step,
  setStep,
  goToPayment,
  navigating,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col">
    {/* Header */}
    <div className="bg-slate-900 p-6 text-white relative overflow-hidden shrink-0">
      <div className="relative z-10">
        <h3 className="font-extrabold text-xl mb-2 line-clamp-2 pr-10">{title}</h3>
        <p className="text-slate-300 text-sm flex items-center gap-2">
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">2D</span>
          <span>Phụ đề Tiếng Việt</span>
        </p>
      </div>
      <Ticket className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
    </div>

    {/* Body */}
    <div className="p-5 flex-1 flex flex-col bg-[#fafafa] dark:bg-gray-800 space-y-4">
      {/* Cinema */}
      <div className="flex items-start gap-2 text-sm">
        <MapPin className="w-4 h-4 text-[#dc2626] mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-slate-800 dark:text-white">{cinemaName}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">{showAddress}</p>
        </div>
      </div>

      {/* Date / time */}
      <div className="flex items-start gap-2 text-sm">
        <Calendar className="w-4 h-4 text-[#dc2626] mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-slate-800 dark:text-white">{showDate}</p>
          <p className="text-xs text-slate-500 dark:text-gray-400">{showTime}</p>
        </div>
      </div>

      {/* Seats */}
      <div className="border-t border-dashed border-slate-200 dark:border-gray-700 pt-3 space-y-2">
        <div className="flex justify-between items-start">
          <span className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wide">Ghế</span>
          <span className="font-black text-slate-900 dark:text-white text-right max-w-[160px] break-words">
            {selectedSeats.length > 0 ? selectedSeats.join(", ") : "—"}
          </span>
        </div>
        {selectedSeats.length > 0 && (
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-gray-400">
              {selectedSeats.length} ghế · {totalTicketPrice.toLocaleString()}đ
            </span>
          </div>
        )}
      </div>

      {/* Active combos */}
      {activeCombos.length > 0 && (
        <div className="border-t border-dashed border-slate-200 dark:border-gray-700 pt-3 space-y-1">
          <span className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wide">Combo</span>
          {activeCombos.map((c) => (
            <div key={c.id} className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-gray-300">{c.name} ×{c.quantity}</span>
              <span className="font-bold text-slate-800 dark:text-white">{(c.price * c.quantity).toLocaleString()}đ</span>
            </div>
          ))}
        </div>
      )}

      {/* Price breakdown */}
      <div className="border-t-2 border-dashed border-slate-300 dark:border-gray-700 pt-3 mt-auto space-y-1">
        {(isMonday || voucherDiscount > 0) && (
          <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400">
            <span>Gốc</span>
            <span className="line-through">{finalTotalPrice.toLocaleString()}đ</span>
          </div>
        )}
        {isMonday && (
          <div className="flex justify-between text-xs text-emerald-600 font-bold">
            <span>Gold Monday −20%</span>
            <span>−{(finalTotalPrice - discountedPrice).toLocaleString()}đ</span>
          </div>
        )}
        {voucherDiscount > 0 && (
          <div className="flex justify-between text-xs text-violet-600 font-bold">
            <span>Voucher {appliedVoucher?.code}</span>
            <span>−{voucherDiscount.toLocaleString()}đ</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-1">
          <span className="font-bold text-slate-700 dark:text-gray-300 text-sm">Tổng cộng</span>
          <span className="font-black text-[#dc2626] text-2xl">
            {priceAfterVoucher.toLocaleString()}<span className="text-sm"> ₫</span>
          </span>
        </div>
      </div>

      {/* Action button */}
      {step === 1 ? (
        <button
          disabled={selectedSeats.length === 0}
          onClick={() => setStep(2)}
          className={`w-full font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
            selectedSeats.length === 0
              ? "bg-slate-200 dark:bg-gray-700 text-slate-400 dark:text-gray-500 cursor-not-allowed"
              : "bg-[#dc2626] hover:bg-red-700 text-white shadow-lg shadow-red-200"
          }`}
        >
          Tiếp tục <ChevronRight size={18} />
        </button>
      ) : (
        <button
          onClick={goToPayment}
          disabled={navigating}
          className="w-full font-black py-3.5 rounded-xl bg-[#dc2626] hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <CreditCard size={16} /> {navigating ? "Đang chuyển..." : "Thanh toán ngay"}
        </button>
      )}
    </div>
  </div>
);

export default BookingSummaryPanel;
