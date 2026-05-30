import React, { useState, useEffect, useMemo } from "react";
import usePagination from "../../shared/hooks/use-pagination";
import { createPortal } from "react-dom";
import { Plus, Tag, Users, Clock, Ticket } from "lucide-react";
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
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  red:     "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  amber:   "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  slate:   "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
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
    uniqueUserCount: raw.uniqueUserCount ?? raw.usedUsersCount ?? 0,
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

  const inp = "w-full border border-slate-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
  const lbl = "block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-[scaleIn_0.2s_ease_forwards]" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <Tag size={18} className="text-red-600" /> Tạo Voucher mới
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors text-lg font-bold">&times;</button>
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
              <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1 ml-1">Để trống = có hiệu lực ngay</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Ngày hết hạn <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={inp} />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
            <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
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

          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50 shadow-sm shadow-red-200">
              {saving ? "Đang lưu..." : "Tạo voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ---- Main ----

const PAGE_SIZE = 8;

const FILTER_CHIPS = [
  { label: "Tất cả",     value: "all" },
  { label: "Còn hiệu lực", value: "active" },
  { label: "Sắp diễn ra", value: "upcoming" },
  { label: "Hết hiệu lực", value: "ended" },
];

export const VouchersManager = () => {
  const [vouchers, setVouchers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { currentPage, totalPages, setTotalPages, paginationItems, goToPage, reset: resetPage } = usePagination();

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

  // Auto-refresh usage counters every 20s without loading spinner
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await axiosInstance.get("/vouchers/admin");
        setVouchers((res.data || []).map(normalizeVoucher));
      } catch { /* silent */ }
    }, 20000);
    return () => clearInterval(id);
  }, []);

  const filteredVouchers = useMemo(() => {
    if (activeTab === "all") return vouchers;
    if (activeTab === "ended") return vouchers.filter((v) =>
      v.computedStatus === "expired" || v.computedStatus === "used-up" || v.computedStatus === "inactive"
    );
    return vouchers.filter((v) => v.computedStatus === activeTab);
  }, [vouchers, activeTab]);

  const computedTotalPages = Math.max(1, Math.ceil(filteredVouchers.length / PAGE_SIZE));
  const pagedVouchers = filteredVouchers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setTotalPages(computedTotalPages); }, [computedTotalPages]);

  const handleTabChange = (val) => { setActiveTab(val); resetPage(); };

  return (
    <div className="space-y-6">
      {showModal && <VoucherModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quản Lý Voucher</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">{vouchers.length} voucher trong hệ thống</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 shrink-0"
        >
          <Plus size={20} /> Tạo voucher
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {FILTER_CHIPS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleTabChange(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 active:scale-95 ${
              activeTab === f.value
                ? f.value === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                : f.value === "upcoming" ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                : f.value === "ended" ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                : "bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-500 border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="text-center py-16">
            <Tag size={32} className="text-slate-200 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-slate-400 dark:text-gray-500 text-sm font-medium">Không tìm thấy voucher nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-700 text-[13px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold">
                  <th className="p-5 pl-6">Mã Voucher</th>
                  <th className="p-5">Chiết khấu</th>
                  <th className="p-5">Giới hạn</th>
                  <th className="p-5">Hiệu lực</th>
                  <th className="p-5">Sử dụng</th>
                  <th className="p-5 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody key={currentPage} className="divide-y divide-slate-100 dark:divide-gray-700">
                {pagedVouchers.map((v, i) => {
                  const display = v.displayStatus;
                  const cd = v.expiryCountdown;
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-all duration-150 group"
                      style={{ animation: "rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${i * 40}ms` }}
                    >
                      {/* Code */}
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${v.computedStatus === "active" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-slate-100 text-slate-400 dark:bg-gray-700 dark:text-gray-500"}`}>
                            {v.discountType === "percent" ? "%" : "đ"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white tracking-widest text-[16px] leading-none mb-1">{v.code}</p>
                            <p className="text-[13px] text-slate-400 dark:text-gray-500 truncate max-w-[160px]">{v.description || "Không có mô tả"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="p-5">
                        <p className="font-bold text-slate-800 dark:text-white text-[16px]">
                          {v.discountType === "percent" ? `−${v.discountValue}%` : `−${v.discountValue.toLocaleString()}đ`}
                        </p>
                        {v.maxDiscount && <p className="text-[13px] text-slate-400 dark:text-gray-500 mt-0.5">Tối đa {v.maxDiscount.toLocaleString()}đ</p>}
                        {v.minOrderAmount > 0 && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px] font-bold">
                            Từ {v.minOrderAmount.toLocaleString()}đ
                          </span>
                        )}
                      </td>

                      {/* Limits */}
                      <td className="p-5">
                        <div className="space-y-1.5 text-sm text-slate-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Ticket size={13} className="text-slate-400 dark:text-gray-500 shrink-0" />
                            {v.usageLimit !== -1 ? `${v.usageLimit} lượt` : "Không giới hạn"}
                          </div>
                          {v.maxUsagePerUser != null && (
                            <div className="flex items-center gap-1.5">
                              <Ticket size={13} className="text-slate-400 dark:text-gray-500 shrink-0 opacity-60" />
                              <span className="text-xs">{v.maxUsagePerUser} lần / user</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Users size={13} className="text-slate-400 dark:text-gray-500 shrink-0" />
                            {v.maxUsers != null ? `${v.maxUsers} users` : "Không giới hạn"}
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="p-5">
                        <div className="space-y-1 text-[15px]">
                          <p className="text-slate-600 dark:text-gray-400">Từ: <span className="font-medium text-slate-700 dark:text-gray-300">{formatDate(v.startDate)}</span></p>
                          <p className="text-slate-600 dark:text-gray-400">Đến: <span className="font-medium text-slate-700 dark:text-gray-300">{formatDate(v.endDate)}</span></p>
                          {cd && cd.urgency !== "expired" && (
                            <p className={`flex items-center gap-1 font-bold text-[13px] mt-1 ${
                              cd.urgency === "critical" ? "text-red-500" : cd.urgency === "warning" ? "text-amber-500" : "text-slate-400 dark:text-gray-500"
                            }`}>
                              <Clock size={12} /> {cd.days > 0 ? `Còn ${cd.days} ngày` : `Còn ${cd.hours} giờ`}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Usage */}
                      <td className="p-5">
                        <div className="min-w-[140px]">
                          <p className="text-[15px] font-medium text-slate-600 dark:text-gray-400">
                            {v.usedCount ?? 0}{v.usageLimit !== -1 ? ` / ${v.usageLimit}` : ""} lượt
                          </p>
                          {v.maxUsers != null && (
                            <p className="text-[13px] text-slate-500 dark:text-gray-400 mt-0.5">
                              <Users size={11} className="inline text-slate-400 dark:text-gray-500 mr-1" />
                              {v.uniqueUserCount ?? 0} / {v.maxUsers} users
                            </p>
                          )}
                          {v.usageLimit === -1 && v.maxUsers == null && (
                            <p className="text-[13px] text-slate-400 dark:text-gray-500">Không giới hạn</p>
                          )}
                          {v.usageLimit !== -1 && (
                            <>
                              <p className="text-[13px] text-slate-400 dark:text-gray-500">{v.usagePercent}%</p>
                              <div className="mt-1.5 w-full bg-slate-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${
                                    v.computedStatus === "used-up" ? "bg-red-400" : v.usagePercent > 80 ? "bg-amber-400" : "bg-emerald-400"
                                  }`}
                                  style={{ width: `${Math.min(v.usagePercent || 0, 100)}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_COLORS[display.color] || STATUS_COLORS.slate}`}>
                          <span className={`w-2 h-2 rounded-full ${display.color === 'emerald' ? 'bg-emerald-500' : display.color === 'amber' ? 'bg-amber-500' : display.color === 'red' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                          {display.label}
                        </span>
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-gray-700 bg-slate-50/40 dark:bg-gray-800">
            <p className="text-xs text-slate-400 dark:text-gray-500">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredVouchers.length)} / {filteredVouchers.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                className="px-2.5 h-8 rounded-lg text-xs font-bold border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
              {paginationItems.map((p, i) =>
                p === null ? (
                  <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-gray-600 text-xs">…</span>
                ) : (
                  <button key={p} onClick={() => goToPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? "bg-[#dc2626] text-white shadow-sm shadow-red-200" : "border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"}`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
                className="px-2.5 h-8 rounded-lg text-xs font-bold border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
