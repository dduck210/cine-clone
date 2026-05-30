import React from "react";
import { X, Clock } from "lucide-react";

const HOLD_SECONDS = 5 * 60;

/**
 * SeatInfoModal — explains the three seat types (normal, VIP, couple).
 * Props:
 *   onClose — () => void
 */
export const SeatInfoModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white dark:bg-gray-800 rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Định nghĩa phòng</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Normal seat */}
          <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-gray-700 border border-slate-100 dark:border-gray-600">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-600 border-2 border-slate-300 dark:border-gray-500 shrink-0 flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-black text-slate-400 dark:text-gray-300">12</span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-0.5">Ghế Thường</h4>
              <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">Ghế tiêu chuẩn, mang lại sự thoải mái tối ưu cho trải nghiệm xem phim cơ bản.</p>
            </div>
          </div>

          {/* VIP seat */}
          <div className="flex gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-400 shrink-0 flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400">12</span>
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-0.5">Ghế VIP</h4>
              <p className="text-sm text-amber-700/70 dark:text-amber-400/70 leading-relaxed">Vị trí trung tâm, tầm nhìn tốt nhất và không gian ngồi rộng rãi hơn.</p>
            </div>
          </div>

          {/* Couple seat */}
          <div className="flex gap-4 p-4 rounded-2xl bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30">
            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/40 border-2 border-pink-400 shrink-0 flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-black text-pink-600 dark:text-pink-400">♥</span>
            </div>
            <div>
              <h4 className="font-bold text-pink-900 dark:text-pink-400 mb-0.5">Ghế Đôi (Sweetbox)</h4>
              <p className="text-sm text-pink-700/70 dark:text-pink-400/70 leading-relaxed">Không gian riêng tư, lãng mạn dành cho cặp đôi với thiết kế vách ngăn tinh tế.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 bg-slate-900 dark:bg-gray-700 hover:bg-[#dc2626] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-slate-200 hover:shadow-red-200 uppercase tracking-widest text-sm"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  </div>
);

/**
 * TimerExpiredModal — shown when the 5-minute seat hold expires.
 * Props:
 *   onReset   — resets timer + clears seat selection
 *   onGoBack  — navigate(-1)
 */
export const TimerExpiredModal = ({ onReset, onGoBack }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
    <div className="bg-white dark:bg-gray-800 rounded-[28px] shadow-2xl max-w-xs w-full overflow-hidden border border-slate-100 dark:border-gray-700 text-center">
      <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-8 pb-6">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-white/30">
          <Clock className="w-9 h-9 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-black text-white mb-1">Hết thời gian giữ ghế</h2>
        <p className="text-red-100 text-sm">Ghế bạn chọn đã được giải phóng. Vui lòng chọn lại.</p>
      </div>
      <div className="p-6 space-y-3">
        <button
          onClick={onReset}
          className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-black py-3.5 rounded-2xl transition-all text-sm uppercase tracking-wider"
        >
          Chọn lại ghế
        </button>
        <button
          onClick={onGoBack}
          className="w-full text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 font-medium text-sm py-2 transition-colors"
        >
          Quay lại trang trước
        </button>
      </div>
    </div>
  </div>
);
