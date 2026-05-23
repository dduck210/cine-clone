import React, { useState, useEffect } from "react";
import { Plus, X, Save, Edit, MapPin, Phone, ImageIcon } from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast from "react-hot-toast";

const STATUS_MAP = {
  active:   { label: "Hoạt động",  cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  incident: { label: "Sự cố",      cls: "bg-amber-50 text-amber-600 border-amber-100" },
  inactive: { label: "Ngừng hoạt động", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const EMPTY = { name: "", address: "", location: "", city: "", phone: "", email: "", image: "", status: "active" };

const CinemaModal = ({ cinema, onClose, onSaved }) => {
  const [form, setForm] = useState(cinema ? { ...cinema } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập tên rạp";
    if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (cinema?._id) {
        await axiosInstance.put(`/admin/cinemas/${cinema._id}`, form);
        toast.success("Đã cập nhật rạp");
      } else {
        await axiosInstance.post("/admin/cinemas", form);
        toast.success("Đã thêm rạp mới");
      }
      onSaved();
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, k, placeholder, required }) => (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 ${errors[k] ? "border-red-400" : "border-slate-200 focus:border-[#dc2626]"}`}
      />
      {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">{cinema ? "Chỉnh sửa rạp" : "Thêm rạp mới"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {form.image && (
            <img src={form.image} alt="preview" className="w-full h-36 object-cover rounded-xl border border-slate-100" onError={(e) => { e.target.style.display = "none"; }} />
          )}
          <Field label="Tên rạp" k="name" placeholder="VD: Megaplex Cinema" required />
          <Field label="Địa chỉ" k="address" placeholder="VD: 123 Đường ABC, Quận 1" required />
          <Field label="Khu vực" k="location" placeholder="VD: Hồ Chí Minh" />
          <Field label="Thành phố" k="city" placeholder="VD: Hồ Chí Minh" />
          <Field label="Số điện thoại" k="phone" placeholder="VD: 028-1234-5678" />
          <Field label="Email" k="email" placeholder="VD: cinema@example.com" />
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ImageIcon size={12} /> URL ảnh rạp
            </label>
            <input
              value={form.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700"
            />
            <p className="text-[11px] text-slate-400 mt-1">Dán URL ảnh từ Unsplash, Google, hoặc bất kỳ nguồn nào</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700"
            >
              {Object.entries(STATUS_MAP).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">Huỷ</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#dc2626] text-white font-bold text-sm flex items-center gap-2 hover:bg-red-700 disabled:opacity-50">
            <Save size={15} />{saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CinemasManager = () => {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | cinema object

  const load = () => {
    setLoading(true);
    axiosInstance.get("/admin/cinemas").then((r) => setCinemas(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fallback = (id) => `https://picsum.photos/seed/${id}/800/400`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Quản lý Rạp</h2>
          <p className="text-sm text-slate-500 mt-0.5">{cinemas.length} rạp chiếu</p>
        </div>
        <button onClick={() => setModal("new")} className="flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-md shadow-red-200">
          <Plus size={16} /> Thêm rạp
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="bg-slate-100 rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cinemas.map((c) => {
            const st = STATUS_MAP[c.status] || STATUS_MAP.active;
            return (
              <div key={c._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all">
                <div className="relative h-40">
                  <img
                    src={c.image || fallback(c._id)}
                    alt={c.name}
                    onError={(e) => { e.target.src = fallback(c._id); }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold border ${st.cls}`}>{st.label}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 text-base mb-2">{c.name}</h3>
                  <div className="flex items-start gap-2 text-slate-500 text-xs mb-1">
                    <MapPin size={13} className="text-[#dc2626] mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{c.address}</span>
                  </div>
                  {c.phone && (
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-3">
                      <Phone size={13} className="text-[#dc2626]" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  <button onClick={() => setModal(c)} className="w-full py-2 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-[#dc2626] text-slate-600 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors border border-slate-100">
                    <Edit size={14} /> Chỉnh sửa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <CinemaModal
          cinema={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
};
