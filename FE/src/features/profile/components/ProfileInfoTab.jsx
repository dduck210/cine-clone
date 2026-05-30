import React, { useState } from "react";
import { User, Mail, Phone, Save } from "lucide-react";
import axiosInstance from "@/api/axiosConfig";
import toast from "react-hot-toast";

const ProfileInfoTab = ({ storedUser }) => {
  const [form, setForm] = useState({ name: storedUser?.name || "", phone: storedUser?.phone || "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const setField = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Họ tên không được để trống";
    else if (form.name.trim().length < 2) errs.name = "Họ tên phải có ít nhất 2 ký tự";
    if (form.phone && !/^[0-9]{9,11}$/.test(form.phone.replace(/\s/g, "")))
      errs.phone = "Số điện thoại không hợp lệ (9-11 chữ số)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await axiosInstance.put("/auth/profile", { name: form.name, phone: form.phone });
      const fresh = JSON.parse(localStorage.getItem("currentUser") || "{}");
      localStorage.setItem("currentUser", JSON.stringify({ ...fresh, name: res.data.name, phone: res.data.phone }));
      setForm({ name: res.data.name, phone: res.data.phone || "" });
      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại, thử lại sau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1 border-l-4 border-red-600 pl-3">Thông Tin Chung</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 pl-4">Quản lý thông tin hồ sơ của bạn để bảo mật tài khoản</p>
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Họ và tên <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className={`absolute left-3 top-3 ${errors.name ? "text-red-400" : "text-gray-400"}`} size={18} />
            <input
              type="text"
              value={form.name}
              onChange={setField("name")}
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium text-gray-900 dark:text-white dark:placeholder-gray-400 ${errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 dark:border-gray-600 focus:border-[#dc2626] focus:ring-red-100"}`}
            />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Số điện thoại</label>
          <div className="relative">
            <Phone className={`absolute left-3 top-3 ${errors.phone ? "text-red-400" : "text-gray-400"}`} size={18} />
            <input
              type="tel"
              value={form.phone}
              onChange={setField("phone")}
              placeholder="0912 345 678"
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium text-gray-900 dark:text-white dark:placeholder-gray-400 ${errors.phone ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 dark:border-gray-600 focus:border-[#dc2626] focus:ring-red-100"}`}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              value={storedUser?.email || ""}
              disabled
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Email không thể thay đổi</p>
        </div>

        <div className="md:col-span-2 mt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 ${saving ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-red-200"}`}
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Save size={18} />
            )}
            {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileInfoTab;
