import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Tag, Users, Clock, Archive } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const EMPTY_FORM = {
  code: "", type: "percent", value: "",
  minOrderAmount: "", maxDiscount: "",
  startsAt: "", expiresAt: "",
  maxUsers: "", maxUsagePerUser: "", totalUsageLimit: "",
  description: "",
};

// ---- Constants & Meta ----

const DISPLAY_COLORS = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red:     "bg-red-50 text-red-600 border-red-200",
  amber:   "bg-amber-50 text-amber-700 border-amber-200",
  zinc:    "bg-gray-100 text-gray-600 border-gray-200",
  slate:   "bg-slate-100 text-slate-600 border-slate-200",
  purple:  "bg-purple-50 text-purple-600 border-purple-200",
};

/**
 * Principal Engineering: Normalization Layer
 * Decouples UI from Raw API Response.
 * MUST provide strict fallbacks and consistent field names.
 */
const normalizeVoucher = (raw) => {
  if (!raw) return null;

  return {
    id: raw._id || raw.id || `v-${Math.random().toString(36).substr(2, 9)}`,
    _id: raw._id || raw.id, 
    code: raw.code || "",
    description: raw.description || "",
    
    // Aligned fields as per log.md Standard
    discountType: raw.discountType || raw.type || "percent",
    discountValue: Number(raw.discountValue || raw.value) || 0,
    minOrderAmount: Number(raw.minOrderAmount) || 0,
    maxDiscount: raw.maxDiscount ?? null,

    // Date normalization
    startDate: raw.startDate || raw.startsAt || null,
    endDate: raw.endDate || raw.expiresAt || null,

    // Usage normalization
    usageLimit: raw.usageLimit ?? -1,
    usedCount: raw.usedCount ?? 0,
    uniqueUserCount: raw.uniqueUserCount ?? raw.usedUsersCount ?? 0,
    maxUsers: raw.maxUsers ?? null,
    maxUsagePerUser: raw.maxUsagePerUser ?? raw.perUserLimit ?? null,

    // Computed Logic from BE (Source of Truth)
    computedStatus: raw.computedStatus || "unknown",
    displayStatus: raw.displayStatus || { label: "Không xác định", color: "slate", icon: "⚪" },
    usagePercent: Number(raw.usagePercent) || 0,
    expiryCountdown: raw.expiryCountdown || null,
    statusTooltip: raw.statusTooltip || "",
  };
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
                <input type="number" min="1" value={form.maxUsagePerUser} onChange={(e) => set("maxUsagePerUser", e.target.value)} placeholder="VD: 1 lần" className={inputCls} />
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
  const [activeTab, setActiveTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try { 
      const res = await axiosInstance.get("/vouchers/admin"); 
      console.log("RAW API:", res.data);

      // Principal: Normalize data immediately after fetch to ensure consistency
      const normalized = (res.data || []).map(v => normalizeVoucher(v));
      console.log("NORMALIZED:", normalized);

      setVouchers(normalized); 
    }
    catch { toast.error("Không tải được danh sách voucher"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // SSOT Filtering based on Backend-computed status
  const filteredVouchers = useMemo(() => {
    if (!Array.isArray(vouchers)) return [];
    
    // Principal Engineering: Production-grade Debugging
    console.log("[Voucher Audit]", {
      activeTab,
      rawData: vouchers,
      filteredCount: vouchers.length,
      timestamp: new Date().toISOString()
    });

    if (activeTab === 'all') return vouchers;
    return vouchers.filter(v => v.computedStatus === activeTab);
  }, [vouchers, activeTab]);

  const archiveVoucher = async (v) => {
    if (!window.confirm(`Lưu trữ voucher "${v.code}"? Sẽ không thể dùng được nữa.`)) return;
    try {
      await axiosInstance.put(`/vouchers/admin/${v._id}`, { status: "archived" });
      await load();
      toast.success("Đã lưu trữ voucher");
    } catch { toast.error("Lỗi khi lưu trữ"); }
  };

  const deleteVoucher = async (id) => {
    if (!window.confirm("Xóa vĩnh viễn voucher này? Hành động này không thể hoàn tác.")) return;
    try { 
      await axiosInstance.delete(`/vouchers/admin/${id}`); 
      setVouchers((p) => p.filter((v) => v._id !== id)); 
      toast.success("Đã xóa"); 
    } catch { toast.error("Lỗi khi xóa"); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const FILTER_CHIPS = [
    { label: "Tất cả", value: "all" },
    { label: "Còn hiệu lực", value: "active" },
    { label: "Hết hạn", value: "expired" },
    { label: "Sắp diễn ra", value: "upcoming" },
    { label: "Hết lượt", value: "used-up" },
  ];

  return (
    <div className="space-y-4">
      {showModal && <VoucherModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Tag size={20} className="text-violet-600" /> Quản lý Voucher 
            <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full ml-2 font-bold uppercase tracking-widest">Principal Standard v5.0</span>
          </h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">Hệ thống voucher chuẩn Production — SSOT Architected</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-md shadow-violet-200 shrink-0">
          <Plus size={18} /> Tạo voucher
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-2">
        {FILTER_CHIPS.map((f, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeTab === f.value 
              ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
              : "bg-white text-slate-400 border-slate-100 hover:bg-slate-50"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-black uppercase tracking-widest">Đang tải dữ liệu chuẩn...</div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-medium bg-white rounded-2xl border border-dashed border-slate-200">Không tìm thấy voucher nào phù hợp.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-[0.2em] text-slate-400 font-black">
                  <th className="p-5 pl-6">Mã Voucher</th>
                  <th className="p-5">Chiết khấu</th>
                  <th className="p-5">Giới hạn</th>
                  <th className="p-5">Hiệu lực</th>
                  <th className="p-5">Sử dụng</th>
                  <th className="p-5 text-center">Trạng thái</th>
                  <th className="p-5 pr-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v, idx) => {
                  const status = v.computedStatus;
                  const display = v.displayStatus || { label: 'Unknown', color: 'slate', icon: '⚪' };
                  const cd = v.expiryCountdown;

                  // Principal: Mandatory RENDER log
                  console.log("RENDER:", v);

                  return (
                    <tr key={v.id || v._id || idx} className="hover:bg-slate-50/50 transition-colors group">
                      {/* Mã */}
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${v.computedStatus === 'active' ? 'bg-violet-50 text-violet-600' : 'bg-slate-50 text-slate-400'}`}>
                            {v.discountType === 'percent' ? '%' : 'đ'}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-[15px] tracking-widest leading-none mb-1.5">{v.code}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight line-clamp-1">{v.description || "Không có mô tả"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Giảm giá */}
                      <td className="p-5">
                        <p className="font-black text-slate-900 text-[16px]">
                          {v.discountType === "percent" ? `−${v.discountValue}%` : `−${v.discountValue.toLocaleString("vi-VN")}đ`}
                        </p>
                        {v.maxDiscount && <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Tối đa {v.maxDiscount.toLocaleString()}đ</p>}
                        {v.minOrderAmount > 0 && (
                          <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded text-[9px] font-black uppercase tracking-tighter">
                            Đơn từ {v.minOrderAmount.toLocaleString()}đ
                          </div>
                        )}
                      </td>

                      {/* GIỚI HẠN CHUẨN (Business-first Rendering) */}
                      <td className="p-5">
                        <div className="space-y-1 text-[12px] font-bold text-slate-500">
                          <p className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-slate-300">🎟</span> 
                            <span className="text-slate-600">Tổng: {v.usageLimit !== -1 ? `${v.usageLimit} lượt` : "Không giới hạn"}</span>
                          </p>
                          <p className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-slate-300">👤</span> 
                            <span className="text-slate-600">Mỗi user: {v.maxUsagePerUser != null ? `${v.maxUsagePerUser} lượt` : "Không giới hạn"}</span>
                          </p>
                          <p className="flex items-center gap-2 whitespace-nowrap">
                            <span className="text-slate-300">👥</span> 
                            <span className="text-slate-600">Tối đa: {v.maxUsers != null ? `${v.maxUsers} users` : "Không giới hạn"}</span>
                          </p>
                        </div>
                      </td>

                      {/* HIỆU LỰC CHUẨN (Only dates, icons for status) */}
                      <td className="p-5">
                        <div className="space-y-1 font-bold text-[12px]">
                          <p className="text-slate-500">
                            Từ: <span className="text-slate-800">{formatDate(v.startDate)}</span>
                          </p>
                          <p className="text-slate-500">
                            Đến: <span className="text-slate-800">{formatDate(v.endDate)}</span>
                          </p>
                          {cd && cd.urgency !== 'expired' && (
                            <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-2 ${
                              cd.urgency === 'critical' ? 'text-red-500' : cd.urgency === 'warning' ? 'text-amber-500' : 'text-slate-400'
                            }`}>
                              <Clock size={12} /> {cd.days > 0 ? `Còn ${cd.days} ngày` : `Còn ${cd.hours} giờ`}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* SỬ DỤNG CHUẨN */}
                      <td className="p-5">
                        <div className="space-y-2 min-w-[140px]">
                          <div className="text-[12px] font-black uppercase tracking-tight">
                            <p className="text-slate-800">
                              {v.usedCount ?? 0} {v.usageLimit !== -1 ? `/ ${v.usageLimit}` : ""} lượt
                            </p>
                            <p className="text-slate-400 mt-0.5">
                              {v.usageLimit !== -1 ? `${v.usagePercent}%` : "Không giới hạn"}
                            </p>
                          </div>
                          {v.usageLimit !== -1 && (
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  v.computedStatus === 'used-up' ? 'bg-red-400' : v.usagePercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(v.usagePercent || 0, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* TRẠNG THÁI CHUẨN (Badge only) */}
                      <td className="p-5 text-center">
                        <div className="flex flex-col items-center group/tip relative">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black border tracking-[0.1em] uppercase shadow-sm ${DISPLAY_COLORS[display.color]}`}>
                            {display.icon} {display.label}
                          </span>
                        </div>
                      </td>

                      {/* THAO TÁC */}
                      <td className="p-5 pr-6 text-right">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {v.status !== "archived" && (
                            <button onClick={() => archiveVoucher(v)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" title="Lưu trữ">
                              <Archive size={18} />
                            </button>
                          )}
                          <button onClick={() => deleteVoucher(v._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Xóa vĩnh viễn">
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
