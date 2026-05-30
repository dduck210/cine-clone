import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import axiosInstance from "@/api/axiosConfig";
import toast from "react-hot-toast";

/**
 * PasswordField — reusable password input with show/hide toggle.
 * Internal to this file only.
 */
const PasswordField = ({ label, field, showKey, form, show, setForm, setShow }) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
    <div className="relative">
      <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
      <input
        type={show[showKey] ? "text" : "password"}
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        placeholder={`Nhập ${label.toLowerCase()}`}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-red-100 transition-all text-sm text-gray-900 dark:text-white dark:placeholder-gray-400"
      />
      <button
        type="button"
        onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        {show[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

/**
 * ChangePasswordTab — change password form with current + new + confirm fields.
 */
const ChangePasswordTab = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const fieldProps = { form, show, setForm, setShow };

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1 border-l-4 border-red-600 pl-3">Đổi Mật Khẩu</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 pl-4">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField label="Mật khẩu hiện tại" field="currentPassword" showKey="current" {...fieldProps} />
        <PasswordField label="Mật khẩu mới" field="newPassword" showKey="newPass" {...fieldProps} />
        <PasswordField label="Xác nhận mật khẩu mới" field="confirmPassword" showKey="confirm" {...fieldProps} />
        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`font-bold py-3 px-8 rounded-xl shadow-md transition-all w-full flex items-center gap-2 justify-center ${saving ? "bg-red-400 cursor-not-allowed text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <Lock size={18} />
            )}
            {saving ? "Đang cập nhật..." : "Cập Nhật Mật Khẩu"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordTab;
