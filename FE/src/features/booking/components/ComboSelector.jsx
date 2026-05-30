import React from "react";
import { Minus, Plus, Popcorn, Tag, X } from "lucide-react";

/**
 * ComboSelector — combo/snack selection panel with voucher input.
 * Props:
 *   combos, updateCombo
 *   voucherInput, setVoucherInput
 *   appliedVoucher, setAppliedVoucher
 *   voucherError, setVoucherError
 *   voucherLoading
 *   handleApplyVoucher
 */
const ComboSelector = ({
  combos,
  updateCombo,
  voucherInput,
  setVoucherInput,
  appliedVoucher,
  setAppliedVoucher,
  voucherError,
  setVoucherError,
  voucherLoading,
  handleApplyVoucher,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-sm p-6">
      <h2 className="font-extrabold text-lg text-slate-800 dark:text-white mb-1 flex items-center gap-2">
        <Popcorn size={20} className="text-[#dc2626]" /> Thêm combo bắp nước
      </h2>
      <p className="text-sm text-slate-400 dark:text-gray-500 mb-6">Không bắt buộc — bỏ qua để thanh toán ngay</p>

      {/* Voucher input */}
      <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/30 rounded-2xl">
        <p className="text-sm font-bold text-violet-800 dark:text-violet-400 mb-3 flex items-center gap-2">
          <Tag size={15} /> Mã giảm giá
        </p>
        {appliedVoucher ? (
          <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-xl px-4 py-3 border border-violet-300 dark:border-violet-600">
            <div>
              <span className="font-black text-violet-700 dark:text-violet-400 text-sm">{appliedVoucher.code}</span>
              <span className="ml-2 text-xs text-emerald-600 font-bold">−{appliedVoucher.discountAmount.toLocaleString()}đ</span>
            </div>
            <button onClick={() => setAppliedVoucher(null)} className="text-slate-400 hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={voucherInput}
              onChange={(e) => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyVoucher()}
              placeholder="Nhập mã voucher..."
              className="flex-1 min-w-0 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder-slate-300 placeholder-normal text-slate-900 dark:text-white"
            />
            <button
              onClick={handleApplyVoucher}
              disabled={voucherLoading || !voucherInput.trim()}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 dark:disabled:bg-gray-600 text-white font-bold rounded-xl text-sm transition-colors shrink-0"
            >
              {voucherLoading ? "..." : "Áp dụng"}
            </button>
          </div>
        )}
        {voucherError && <p className="text-red-500 text-xs font-bold mt-2">{voucherError}</p>}
      </div>

      {/* Combo grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {combos.map((combo) => (
          <div
            key={combo.id}
            className={`rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all ${combo.quantity > 0 ? "border-[#dc2626] bg-red-50 dark:bg-red-900/20" : "border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-slate-300 dark:hover:border-gray-600"}`}
          >
            <div className="text-3xl">{combo.emoji}</div>
            <div className="flex-1">
              <p className="font-extrabold text-slate-900 dark:text-white">{combo.name}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{combo.detail}</p>
              <p className="font-black text-[#dc2626] text-lg mt-2">{combo.price.toLocaleString()}<span className="text-sm">đ</span></p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-gray-600 px-3 py-2 rounded-xl">
                <button onClick={() => updateCombo(combo.id, -1)} className="text-slate-500 dark:text-gray-300 hover:text-[#dc2626] transition-colors">
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span className="font-black text-sm w-5 text-center text-slate-900 dark:text-white">{combo.quantity}</span>
                <button onClick={() => updateCombo(combo.id, 1)} className="text-slate-500 dark:text-gray-300 hover:text-[#dc2626] transition-colors">
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
              {combo.quantity > 0 && (
                <span className="text-xs font-bold text-[#dc2626]">{(combo.price * combo.quantity).toLocaleString()}đ</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComboSelector;
