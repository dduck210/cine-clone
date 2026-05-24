import React, { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag, Users, Ticket, Clock, Calendar, Archive } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const EMPTY_FORM = {
  code: "", type: "percent", value: "",
  minOrderAmount: "", maxDiscount: "",
  startsAt: "", expiresAt: "",
  maxUsers: "", maxUsagePerUser: "", totalUsageLimit: "",
  description: "",
};

// ---- Status config maps (fully runtime, no DB persistence for effective/usage) ----

const EFFECTIVE_META = {
  upcoming: { label: "Sắp diễn ra", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  active:   { label: "Còn hiệu lực", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  expired:  { label: "Đã hết hạn",  badge: "bg-red-50 text-red-500 border-red-100" },
};

const USAGE_META = {
  unlimited: { label: "Không giới hạn", badge: "bg-blue-50 text-blue-600 border-blue-100" },
  available: { label: "Còn lượt",      badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  limited:   { label: "Sắp hết",       badge: "bg-orange-50 text-orange-600 border-orange-200" },
  sold_out:  { label: "Hết lượt",      badge: "bg-slate-100 text-slate-500 border-slate-200" },
};

const SYSTEM_STATUS_META = {
  active:   { label: "Đang bật",  badge: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  inactive: { label: "Đã tắt",    badge: "bg-slate-100 text-slate-500 border-slate-200" },
  draft:    { label: "Bản nháp",  badge: "bg-purple-50 text-purple-600 border-purple-100" },
  archived: { label: "Lưu trữ",   badge: "bg-slate-200 text-slate-600 border-slate-300" },
};

const USAGE_BAR_COLORS = {
  unlimited: "#64748b",
  available: "#10b981",
  limited:   "#f97316",
  sold_out:  "#ef4444",
};

const DISPLAY_COLORS = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red:     "bg-red-50 text-red-600 border-red-200",
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  orange:  "bg-orange-50 text-orange-600 border-orange-200",
  zinc:    "bg-gray-100 text-gray-600 border-gray-200",
  slate:   "bg-slate-100 text-slate-600 border-slate-200",
  purple:  "bg-purple-50 text-purple-600 border-purple-200",
};

// ---- Voucher Modal (Create) ----

const VoucherModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.value || !form.expiresAt) return toast.error("Điền đủ các trường bắt buộc");
    setSaving(true);
    
    // Explicitly handle null/undefined and numeric conversion
    const payload = {
      ...form,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscount: (form.maxDiscount !== "" && form.maxDiscount != null) ? Number(form.maxDiscount) : null,
      startsAt: form.startsAt || null,
      maxUsers: (form.maxUsers !== "" && form.maxUsers != null) ? Number(form.maxUsers) : null,
      maxUsagePerUser: (form.maxUsagePerUser !== "" && form.maxUsagePerUser != null) ? Number(form.maxUsagePerUser) : null,
      totalUsageLimit: (form.totalUsageLimit !== "" && form.totalUsageLimit != null) ? Number(form.totalUsageLimit) : null,
    };

    try {
      await axiosInstance.post("/vouchers/admin", payload);
      toast.success("Đã tạo voucher!");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo voucher");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all";
  const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-black text-lg text-slate-800 flex items-center gap-2"><Tag size={20} className="text-violet-600" /> Tạo Voucher mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors text-xl font-bold leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mã code <span className="text-red-500">*</span></label>
              <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="VD: SUMMER20" className={`${inputCls} uppercase font-bold tracking-widest`} autoFocus />
            </div>
            <div>
              <label className={labelCls}>Loại giảm giá</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{form.type === "percent" ? "Giảm (%)" : "Giảm (đ)"} <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder={form.type === "percent" ? "VD: 20" : "VD: 50000"} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Giảm tối đa (đ)</label>
              <input type="number" min="0" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} placeholder="Bỏ trống = không giới hạn" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Đơn tối thiểu (đ)</label>
              <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => set("minOrderAmount", e.target.value)} placeholder="0 = không yêu cầu" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ngày bắt đầu</label>
              <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={inputCls} />
              <p className="text-[11px] text-slate-400 mt-1 ml-1">Để trống = có hiệu lực ngay</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ngày hết hạn <span className="text-red-500">*</span></label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Users size={14} /> Giới hạn sử dụng</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Giới hạn số user</label>
                <input type="number" min="1" value={form.maxUsers} onChange={(e) => set("maxUsers", e.target.value)} placeholder="VD: 10 user" className={inputCls} />
                <p className="text-[11px] text-slate-400 mt-1 ml-1">Bỏ trống = không giới hạn</p>
              </div>
              <div>
                <label className={labelCls}>Lượt tối đa / user</label>
                <input type="number" min="1" value={form.maxUsagePerUser} onChange={(e) => set("maxUsagePerUser", e.target.value)} placeholder="VD: 3 lần" className={inputCls} />
                <p className="text-[11px] text-slate-400 mt-1 ml-1">Bỏ trống = không giới hạn</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelCls}>Tổng lượt dùng tối đa</label>
                <input type="number" min="1" value={form.totalUsageLimit} onChange={(e) => set("totalUsageLimit", e.target.value)} placeholder="VD: 100 lượt" className={inputCls} />
                <p className="text-[11px] text-slate-400 mt-1 ml-1">Bỏ trống = không giới hạn</p>
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Mô tả</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Nhập mô tả ngắn..." className={inputCls} />
          </div>
          <div className="flex gap-3 pt-3 border-t border-slate-50">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors disabled:opacity-50 shadow-md shadow-violet-200">
              {saving ? "Đang lưu..." : "Tạo voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Main Manager ----

export const VouchersManager = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [, setTick] = useState(0);

  // Re-compute display every 60s so countdowns stay fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const [activeFilter, setActiveFilter] = useState({ type: "all", value: "all" });

  const load = async () => {
    setLoading(true);
    try { const res = await axiosInstance.get("/vouchers/admin"); setVouchers(res.data); }
    catch { toast.error("Không tải được danh sách voucher"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const archiveVoucher = async (v) => {
    if (!window.confirm(`Lưu trữ voucher "${v.code}"? Sẽ không thể dùng được nữa.`)) return;
    try {
      await axiosInstance.put(`/vouchers/admin/${v._id}`, { status: "archived" });
      setVouchers((prev) => prev.map((x) => x._id === v._id ? { ...x, status: "archived" } : x));
      toast.success("Đã lưu trữ voucher");
    } catch { toast.error("Lỗi khi lưu trữ"); }
  };

  const deleteVoucher = async (id) => {
    if (!window.confirm("Xóa vĩnh viễn voucher này? Hành động này không thể hoàn tác.")) return;
    try { await axiosInstance.delete(`/vouchers/admin/${id}`); setVouchers((p) => p.filter((v) => v._id !== id)); toast.success("Đã xóa"); }
    catch { toast.error("Lỗi khi xóa"); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const formatCountdown = (cd) => {
    if (!cd || cd.urgency === "expired") return null;
    if (cd.days > 0) return `Còn ${cd.days} ngày`;
    if (cd.hours > 0) return `Còn ${cd.hours}h`;
    return "Sắp hết hạn";
  };

  const countdownColor = (urgency) => {
    if (urgency === "critical") return "text-red-500";
    if (urgency === "warning") return "text-amber-500";
    return "text-slate-400";
  };

  const filteredVouchers = vouchers.filter(v => {
    if (activeFilter.type === "all") return true;
    if (activeFilter.type === "effective") return v.effectiveStatus === activeFilter.value;
    if (activeFilter.type === "usage") return v.usageStatus === activeFilter.value;
    return true;
  });

  const FILTER_CHIPS = [
    { label: "Tất cả", type: "all", value: "all" },
    { label: "Còn hiệu lực", type: "effective", value: "active" },
    { label: "Hết hạn", type: "effective", value: "expired" },
    { label: "Sắp diễn ra", type: "effective", value: "upcoming" },
    { label: "Hết lượt", type: "usage", value: "sold_out" },
  ];

  return (
    <div className="space-y-4">
      {showModal && <VoucherModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Tag size={20} className="text-violet-600" /> Quản lý Voucher <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full ml-2 font-bold">v3.2 Filter Restored</span></h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">Hệ thống quản lý mã giảm giá Realtime Premium</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-md shadow-violet-200 shrink-0">
          <Plus size={18} /> Tạo voucher
        </button>
      </div>

      {/* Filters (Modern Chips) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-2">
        {FILTER_CHIPS.map((f, i) => (
          <button
            key={i}
            onClick={() => setActiveFilter({ type: f.type, value: f.value })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeFilter.type === f.type && activeFilter.value === f.value 
              ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
              : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Đang tải...</div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-medium">Không tìm thấy voucher nào.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[12px] uppercase tracking-widest text-slate-500 font-black">
                  <th className="p-5 pl-6">Mã</th>
                  <th className="p-5">Giảm giá</th>
                  <th className="p-5">Giới hạn</th>
                  <th className="p-5">Hiệu lực</th>
                  <th className="p-5">Sử dụng</th>
                  <th className="p-5 text-center">Trạng thái</th>
                  <th className="p-5 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => {
                  const effMeta = EFFECTIVE_META[v.effectiveStatus] || {};
                  const useMeta = USAGE_META[v.usageStatus] || {};
                  const sysMeta = SYSTEM_STATUS_META[v.status] || SYSTEM_STATUS_META.inactive;
                  const barColor = USAGE_BAR_COLORS[v.usageStatus] || "#64748b";
                  const cd = v.expiryCountdown;
                  const cdText = formatCountdown(cd);
                  const isActive = v.status === "active";

                  return (
                    <tr key={v._id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Mã */}
                      <td className="p-5 pl-6">
                        <p className="font-black text-violet-700 text-[16px] tracking-widest">{v.code}</p>
                        {v.description && <p className="text-[12px] text-slate-400 mt-0.5 line-clamp-1">{v.description}</p>}
                      </td>

                      {/* Giảm giá */}
                      <td className="p-5">
                        <p className="font-black text-slate-800 text-[16px]">
                          {v.type === "percent" ? `−${v.value}%` : `−${v.value.toLocaleString("vi-VN")}đ`}
                        </p>
                        {v.maxDiscount && <p className="text-[11px] text-slate-400 mt-0.5">Tối đa {v.maxDiscount.toLocaleString()}đ</p>}
                        {v.minOrderAmount > 0 && <p className="text-[11px] text-violet-500 font-bold mt-0.5">Đơn từ {v.minOrderAmount.toLocaleString()}đ</p>}
                      </td>

                      {/* Giới hạn */}
                      <td className="p-5">
                        <div className="space-y-1 text-[13px] font-bold text-slate-600">
                          <p className="flex items-center gap-2">
                            <span className="text-base">👤</span> 
                            {v.maxUsers != null ? `${v.maxUsers} users` : "Không giới hạn"}
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-base">🎫</span> 
                            {v.maxUsagePerUser != null ? `${v.maxUsagePerUser} lần/user` : "Không giới hạn"}
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-base">👥</span> 
                            {v.totalUsageLimit != null ? `Tổng: ${v.totalUsageLimit} lượt` : "Không giới hạn"}
                          </p>
                        </div>
                      </td>

                      {/* Hiệu lực */}
                      <td className="p-5">
                        <div className="space-y-1">
                          <p className={`flex items-center gap-1.5 font-black text-[13px] ${v.effectiveStatus === 'active' ? 'text-emerald-600' : v.effectiveStatus === 'upcoming' ? 'text-amber-600' : 'text-red-500'}`}>
                            {v.effectiveStatus === 'active' ? "🟢 Còn hiệu lực" : v.effectiveStatus === 'upcoming' ? "🟡 Sắp diễn ra" : "🔴 Đã hết hạn"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-bold">
                            {v.effectiveStatus === 'expired' ? "Hết hạn ngày: " : "Hiệu lực đến: "}
                            {formatDate(v.expiresAt)}
                          </p>
                          {cdText && (
                            <p className={`text-[11px] font-bold ${countdownColor(cd?.urgency)} flex items-center gap-1`}>
                              <Clock size={12} /> {cdText}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Sử dụng */}
                      <td className="p-5">
                        <div className="space-y-2 min-w-[140px]">
                          {v.totalUsageLimit != null ? (
                            <>
                              <div className="flex justify-between items-center text-[12px] font-black text-slate-700">
                                <span>{v.totalUsedCount ?? 0} / {v.totalUsageLimit} lượt</span>
                                <span className="text-slate-400 font-medium">{v.usagePercent ?? 0}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${Math.min(v.usagePercent ?? 0, 100)}%`, backgroundColor: barColor }}
                                />
                              </div>
                            </>
                          ) : (
                            <p className="text-[13px] font-bold text-emerald-600 italic">Khách dùng vô tận</p>
                          )}
                          <p className="text-[11px] text-slate-500 font-bold">
                            <span className="text-slate-400">👤</span> {v.uniqueUserCount ?? 0} / {v.maxUsers != null ? v.maxUsers : "∞"} users
                          </p>
                        </div>
                      </td>

                      {/* Trạng thái (Final Computed Status) */}
                      <td className="p-5 text-center">
                        <div className="flex flex-col items-center gap-1.5 group/tip relative">
                          <span className={`px-3 py-1.5 rounded-full text-[11px] font-black border tracking-wider uppercase ${DISPLAY_COLORS[v.displayStatus?.color] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                            {v.displayStatus?.label || "Unknown"}
                          </span>
                          {v.statusTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[180px] p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 shadow-xl font-bold">
                              {v.statusTooltip}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="p-5 pr-6 text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          {v.status !== "archived" && (
                            <button onClick={() => archiveVoucher(v)} className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-xl transition-all" title="Lưu trữ">
                              <Archive size={18} />
                            </button>
                          )}
                          <button onClick={() => deleteVoucher(v._id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Xóa vĩnh viễn">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
