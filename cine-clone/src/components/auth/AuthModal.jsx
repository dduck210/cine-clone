import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    let err = {};
    if (!formData.email.includes("@")) err.email = "Email không hợp lệ";
    if (formData.password.length < 6)
      err.password = "Mật khẩu tối thiểu 6 ký tự";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans font-bold">
      <Toaster position="top-center" />
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[500px] p-10 animate-scale-in">
        <h2 className="text-2xl font-bold text-center mb-10 text-slate-800 uppercase">
          Xác thực tài khoản
        </h2>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            validate();
          }}
        >
          <div className="relative border-b border-slate-300">
            <label
              className={`text-[11px] font-bold uppercase ${errors.email ? "text-red-500" : "text-slate-500"}`}
            >
              Email
            </label>
            <input
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              type="email"
              className="w-full py-2 outline-none bg-transparent"
            />
            {errors.email && (
              <p className="absolute -bottom-5 text-[10px] text-red-500 italic">
                {errors.email}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-[#dc2626] text-white font-bold py-4 rounded uppercase mt-4"
          >
            Kiểm tra
          </button>
        </form>
      </div>
    </div>
  );
};
export default AuthModal;
