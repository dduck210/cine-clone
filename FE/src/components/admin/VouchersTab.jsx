import React, { useState, useEffect } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const EMPTY_FORM = { code: "", type: "percent", value: "", minOrderAmount: "", maxDiscount: "", expiresAt: "", usageLimit: "", perUserLimit: "1", description: "" };

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
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perUserLimit: Number(form.perUserLimit) || 1,
      });
      toast.success("Đã tạo voucher!");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo voucher");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  const labelCls = "block text-xs font-bold text-slate-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-800 flex items-center gap-2"><Tag size={18} className="text-violet-600" /> Tạo Voucher mới</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mã code *</label>
              <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="VD: SUMMER20" className={`${inputCls} uppercase font-bold tracking-widest`} />
            </div>
            <div>
              <label className={labelCls}>Loại</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (đ)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{form.type === "percent" ? "Giảm (%) *" : "Giảm (đ) *"}</label>
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
              <label className={labelCls}>Hết hạn *</label>
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tổng lượt dùng</label>
              <input type="number" min="1" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="Bỏ trống = không giới hạn" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Lượt / user</label>
              <input type="number" min="1" value={form.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Mô tả</label>
            <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Nhập mô tả ngắn..." className={inputCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-50">{saving ? "Đang lưu..." : "Tạo voucher"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const VouchersManager = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await axiosInstance.get("/vouchers/admin"); setVouchers(res.data); }
    catch { toast.error("Không tải được danh sách voucher"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (v) => {
    try {
      await axiosInstance.put(`/vouchers/admin/${v._id}`, { status: v.status === "active" ? "inactive" : "active" });
      setVouchers((prev) => prev.map((x) => x._id === v._id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x));
    } catch { toast.error("Lỗi khi cập nhật"); }
  };

  const deleteVoucher = async (id) => {
    if (!window.confirm("Xóa voucher này?")) return;
    try { await axiosInstance.delete(`/vouchers/admin/${id}`); setVouchers((p) => p.filter((v) => v._id !== id)); toast.success("Đã xóa"); }
    catch { toast.error("Lỗi khi xóa"); }
  };

  return (
    <div>
      {showModal && <VoucherModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Tag size={20} className="text-violet-600" /> Quản lý Voucher</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Tạo voucher
        </button>
      </div>
      {loading ? <div className="text-center py-16 text-slate-400">Đang tải...</div> : vouchers.length === 0 ? (
        <div className="text-center py-16 text-slate-400 font-bold">Chưa có voucher nào.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wide">
              <tr>{["Mã", "Loại / Giá trị", "Đơn tối thiểu", "Hết hạn", "Đã dùng", "Trạng thái", ""].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vouchers.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-black text-violet-700 tracking-widest">{v.code}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">
                    {v.type === "percent" ? `−${v.value}%` : `−${v.value.toLocaleString("vi-VN")}đ`}
                    {v.maxDiscount ? <span className="ml-1 text-xs text-slate-400">(tối đa {v.maxDiscount.toLocaleString()}đ)</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{v.minOrderAmount ? v.minOrderAmount.toLocaleString("vi-VN") + "đ" : "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(v.expiresAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4 py-3 text-slate-500">{v.usedCount}{v.usageLimit ? `/${v.usageLimit}` : ""}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(v)} className="flex items-center gap-1.5 text-xs font-bold transition-colors">
                      {v.status === "active"
                        ? <><ToggleRight size={20} className="text-emerald-500" /><span className="text-emerald-600">Đang bật</span></>
                        : <><ToggleLeft size={20} className="text-slate-400" /><span className="text-slate-400">Tắt</span></>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteVoucher(v._id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
