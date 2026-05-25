import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Tag, Users, Clock, Archive, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const EMPTY_FORM = {
  code: "", type: "percent", value: "",
  minOrderAmount: "", maxDiscount: "",
  startsAt: "", expiresAt: "",
  maxUsers: "", maxUsagePerUser: "", totalUsageLimit: "",
  description: "",
};

const STATUS_COLORS = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red:     "bg-red-50 text-red-600 border-red-200",
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  zinc:    "bg-gray-100 text-gray-600 border-gray-200",
  slate:   "bg-slate-100 text-slate-600 border-slate-200",
  purple:  "bg-purple-50 text-purple-600 border-purple-200",
};

const normalizeVoucher = (raw) => {
  if (!raw) return null;
  return {
    id: raw._id || raw.id,
    _id: raw._id || raw.id,
    code: raw.code || "",
    description: raw.description || "",
    discountType: raw.discountType || raw.type || "percent",
    discountValue: Number(raw.discountValue || raw.value) || 0,
    minOrderAmount: Number(raw.minOrderAmount) || 0,
    maxDiscount: raw.maxDiscount ?? null,
    startDate: raw.startDate || raw.startsAt || null,
    endDate: raw.endDate || raw.expiresAt || null,
    usageLimit: raw.usageLimit ?? -1,
    usedCount: raw.usedCount ?? 0,
    maxUsers: raw.maxUsers ?? null,
    maxUsagePerUser: raw.maxUsagePerUser ?? raw.perUserLimit ?? null,
    computedStatus: raw.computedStatus || "unknown",
    displayStatus: raw.displayStatus || { label: "Không xác định", color: "slate", icon: "" },
    usagePercent: Number(raw.usagePercent) || 0,
    expiryCountdown: raw.expiryCountdown || null,
    status: raw.status || "",
  };
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// ---- Create Modal ----

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

  const inp = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all";
  const lbl = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease_forwards]" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-black text-lg text-slate-800 flex items-center gap-2">
            <Tag size={18} className="text-violet-600" /> Tạo Voucher mới
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Mã code <span className="text-red-500">*</span></label>
              <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="VD: SUMMER20" className={`${inp} uppercase font-bold tracking-widest`} autoFocus />
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
              <input type="number" min="1" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder={form.type === "percent" ? "VD: 20" : "VD: 50000"} className={inp} />
            </div>
            <div>
              <label className={lbl}>Giảm tối đa (đ)</label>
              <input type="number" min="0" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} placeholder="Bỏ trống = không giới hạn" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Đơn tối thiểu (đ)</label>
              <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="0 = không yêu cầu" className={inp} />
            </div>
            <div>
              <label className={lbl}>Ngày bắt đầu</label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={inp} />
              <p className="text-[11px] text-slate-400 mt-1 ml-1">Để trống = có hiệu lực ngay</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Ngày hết hạn <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={inp} />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users size={13} /> Giới hạn sử dụng
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Giới hạn số user</label>
                <input type="number" min="1" value={form.maxUsers} onChange={(e) => set("maxUsers", e.target.value)} placeholder="Bỏ trống = không giới hạn" className={inp} />
              </div>
              <div>
                <label className={lbl}>Lượt tối đa / user</label>
                <input type="number" min="1" value={form.maxUsagePerUser} onChange={(e) => set("maxUsagePerUser", e.target.value)} placeholder="Bỏ trống = không giới hạn" className={inp} />
              </div>
            </div>
            <div className="mt-4">
              <label className={lbl}>Tổng lượt dùng tối đa</label>
              <input type="number" min="1" value={form.totalUsageLimit} onChange={(e) => set("totalUsageLimit", e.target.value)} placeholder="Bỏ trống = không giới hạn" className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Mô tả</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Nhập mô tả ngắn..." className={inp} />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors disabled:opacity-50 shadow-sm shadow-violet-200">
              {saving ? "Đang lưu..." : "Tạo voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ---- Confirm Modal ----

const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onClose, loading }) =>
  createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-[scaleIn_0.2s_ease_forwards]">
        <h3 className="text-lg font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Huỷ</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-50 ${confirmClass}`}>
            {loading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

// ---- Main ----

const PAGE_SIZE = 8;

const FILTER_CHIPS = [
  { label: "Tất cả",     value: "all" },
  { label: "Còn hiệu lực", value: "active" },
  { label: "Hết hạn",   value: "expired" },
  { label: "Sắp diễn ra", value: "upcoming" },
  { label: "Hết lượt",  value: "used-up" },
];

export const VouchersManager = () => {
  const [vouchers, setVouchers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirm, setConfirm]     = useState(null);
  const [acting, setActing]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/vouchers/admin");
      setVouchers((res.data || []).map(normalizeVoucher));
    } catch {
      toast.error("Không tải được danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredVouchers = useMemo(() => {
    const list = activeTab === "all" ? vouchers : vouchers.filter((v) => v.computedStatus === activeTab);
    return list;
  }, [vouchers, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / PAGE_SIZE));
  const pagedVouchers = filteredVouchers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTabChange = (val) => { setActiveTab(val); setCurrentPage(1); };

  const paginationItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  const handleConfirmAction = async () => {
    if (!confirm) return;
    setActing(true);
    try {
      if (confirm.type === "archive") {
        await axiosInstance.put(`/vouchers/admin/${confirm.voucher._id}`, { status: "archived" });
        toast.success("Đã lưu trữ voucher");
        await load();
      } else {
        await axiosInstance.delete(`/vouchers/admin/${confirm.voucher._id}`);
        setVouchers((p) => p.filter((v) => v._id !== confirm.voucher._id));
        toast.success("Đã xóa voucher");
      }
      setConfirm(null);
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-4">
      {showModal && <VoucherModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
      {confirm && (
        <ConfirmModal
          title={confirm.type === "archive" ? "Lưu trữ voucher?" : "Xóa voucher?"}
          message={confirm.type === "archive"
            ? `Voucher "${confirm.voucher.code}" sẽ không thể sử dụng được nữa.`
            : `Xóa vĩnh viễn voucher "${confirm.voucher.code}"? Hành động này không thể hoàn tác.`}
          confirmLabel={confirm.type === "archive" ? "Lưu trữ" : "Xóa"}
          confirmClass={confirm.type === "archive" ? "bg-amber-500 hover:bg-amber-600" : "bg-red-600 hover:bg-red-700"}
          onConfirm={handleConfirmAction}
          onClose={() => setConfirm(null)}
          loading={acting}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
            <Tag size={18} className="text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 leading-tight">Quản lý Voucher</h2>
            <p className="text-xs text-slate-400 mt-0.5">{vouchers.length} voucher trong hệ thống</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-violet-200 shrink-0"
        >
          <Plus size={16} /> Tạo voucher
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleTabChange(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeTab === f.value
                ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-5 animate-pulse">
                <div className="w-11 h-11 bg-slate-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
                <div className="w-20 h-5 bg-slate-100 rounded-full" />
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm font-medium">Không tìm thấy voucher nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Mã Voucher</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Chiết khấu</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Giới hạn</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Hiệu lực</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Sử dụng</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedVouchers.map((v, i) => {
                  const display = v.displayStatus;
                  const cd = v.expiryCountdown;
                  return (
                    <tr
                      key={v.id}
                      className="group opacity-0 animate-[fadeSlideIn_0.3s_ease_forwards] border-l-2 border-transparent hover:border-violet-400 hover:bg-slate-50/50 transition-[border-color,background-color] duration-200"
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      {/* Code */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${v.computedStatus === "active" ? "bg-violet-50 text-violet-600" : "bg-slate-100 text-slate-400"}`}>
                            {v.discountType === "percent" ? "%" : "đ"}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 tracking-widest text-sm leading-none mb-1">{v.code}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[140px]">{v.description || "Không có mô tả"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900 text-base">
                          {v.discountType === "percent" ? `−${v.discountValue}%` : `−${v.discountValue.toLocaleString()}đ`}
                        </p>
                        {v.maxDiscount && <p className="text-xs text-slate-400 mt-0.5">Tối đa {v.maxDiscount.toLocaleString()}đ</p>}
                        {v.minOrderAmount > 0 && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded text-[10px] font-bold">
                            Từ {v.minOrderAmount.toLocaleString()}đ
                          </span>
                        )}
                      </td>

                      {/* Limits */}
                      <td className="px-5 py-4">
                        <div className="space-y-1.5 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Ticket size={13} className="text-slate-400 shrink-0" />
                            {v.usageLimit !== -1 ? `${v.usageLimit} lượt` : "Không giới hạn"}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users size={13} className="text-slate-400 shrink-0" />
                            {v.maxUsers != null ? `${v.maxUsers} users` : "Không giới hạn"}
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-500">Từ: <span className="font-semibold text-slate-700">{formatDate(v.startDate)}</span></p>
                          <p className="text-slate-500">Đến: <span className="font-semibold text-slate-700">{formatDate(v.endDate)}</span></p>
                          {cd && cd.urgency !== "expired" && (
                            <p className={`flex items-center gap-1 font-bold text-xs mt-1 ${
                              cd.urgency === "critical" ? "text-red-500" : cd.urgency === "warning" ? "text-amber-500" : "text-slate-400"
                            }`}>
                              <Clock size={12} /> {cd.days > 0 ? `Còn ${cd.days} ngày` : `Còn ${cd.hours} giờ`}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="px-5 py-4">
                        <div className="min-w-[120px]">
                          <p className="text-sm font-bold text-slate-700">
                            {v.usedCount ?? 0}{v.usageLimit !== -1 ? ` / ${v.usageLimit}` : ""} lượt
                          </p>
                          <p className="text-xs text-slate-400">{v.usageLimit !== -1 ? `${v.usagePercent}%` : "Không giới hạn"}</p>
                          {v.usageLimit !== -1 && (
                            <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  v.computedStatus === "used-up" ? "bg-red-400" : v.usagePercent > 80 ? "bg-amber-400" : "bg-emerald-400"
                                }`}
                                style={{ width: `${Math.min(v.usagePercent || 0, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border tracking-wide uppercase ${STATUS_COLORS[display.color] || STATUS_COLORS.slate}`}>
                          {display.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          {v.status !== "archived" && (
                            <button
                              onClick={() => setConfirm({ type: "archive", voucher: v })}
                              className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                              title="Lưu trữ"
                            >
                              <Archive size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirm({ type: "delete", voucher: v })}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Xóa vĩnh viễn"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
            <p className="text-xs text-slate-400">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredVouchers.length)} / {filteredVouchers.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-2.5 h-8 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
              {paginationItems.map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs">…</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? "bg-violet-600 text-white shadow-sm shadow-violet-200" : "border border-slate-200 text-slate-600 hover:bg-white"}`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                className="px-2.5 h-8 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
