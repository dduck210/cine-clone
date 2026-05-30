import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Tag, Users } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/api/axiosConfig";

const EMPTY_FORM = {
  code: "", type: "percent", value: "",
  minOrderAmount: "", maxDiscount: "",
  startsAt: "", expiresAt: "",
  maxUsers: "", maxUsagePerUser: "", totalUsageLimit: "",
  description: "",
};

/**
 * VoucherModal — create-voucher form rendered via portal over the page.
 * @param {{ onClose: () => void, onSaved: () => void }} props
 */
const VoucherModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.expiresAt) return toast.error("Điền đủ các trường bắt buộc");
    setSaving(true);
    try {
      await axiosInstance.post("/vouchers/admin", {
        ...form,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
        startsAt: form.startsAt || null,
        maxUsers: form.maxUsers !== "" ? Number(form.maxUsers) : null,
        maxUsagePerUser: form.maxUsagePerUser !== "" ? Number(form.maxUsagePerUser) : null,
        totalUsageLimit: form.totalUsageLimit !== "" ? Number(form.totalUsageLimit) : null,
      });
      toast.success("Đã tạo voucher!");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo voucher");
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full border border-slate-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
  const lbl = "block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Tag size={18} className="text-red-600" /> Tạo Voucher mới
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Mã code <span className="text-red-500">*</span></label>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="VD: SUMMER20"
                className={`${inp} uppercase font-bold tracking-widest`}
                autoFocus
              />
            </div>
            <div>
              <label className={lbl}>Loại giảm giá</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inp}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>{form.type === "percent" ? "Giảm (%)" : "Giảm (đ)"} <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder={form.type === "percent" ? "VD: 20" : "VD: 50000"}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Giảm tối đa (đ)</label>
              <input
                type="number"
                min="0"
                value={form.maxDiscount}
                onChange={(e) => set("maxDiscount", e.target.value)}
                placeholder="Bỏ trống = không giới hạn"
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Đơn tối thiểu (đ)</label>
              <input
                type="number"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => set("minOrderAmount", e.target.value)}
                placeholder="0 = không yêu cầu"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Ngày bắt đầu</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
                className={inp}
              />
              <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1 ml-1">Để trống = có hiệu lực ngay</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Ngày hết hạn <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
                className={inp}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
            <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users size={13} /> Giới hạn sử dụng
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Giới hạn số user</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUsers}
                  onChange={(e) => set("maxUsers", e.target.value)}
                  placeholder="Bỏ trống = không giới hạn"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>Lượt tối đa / user</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUsagePerUser}
                  onChange={(e) => set("maxUsagePerUser", e.target.value)}
                  placeholder="Bỏ trống = không giới hạn"
                  className={inp}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={lbl}>Tổng lượt dùng tối đa</label>
              <input
                type="number"
                min="1"
                value={form.totalUsageLimit}
                onChange={(e) => set("totalUsageLimit", e.target.value)}
                placeholder="Bỏ trống = không giới hạn"
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Mô tả</label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Nhập mô tả ngắn..."
              className={inp}
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50 shadow-sm shadow-red-200"
            >
              {saving ? "Đang lưu..." : "Tạo voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default VoucherModal;
