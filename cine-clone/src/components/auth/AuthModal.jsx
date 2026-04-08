import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, Calendar } from "lucide-react";

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans font-bold">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[500px] p-10 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-[#dc2626] transition-all"
        >
          <X size={20} />
        </button>
        <div className="flex justify-center mb-6">
          <img
            src="https://www.galaxycine.vn/_next/static/media/icon-login.fbbf1b2d.svg"
            className="h-24"
            alt="logo"
          />
        </div>
        <h2 className="text-2xl font-bold text-center mb-10 text-slate-800 uppercase">
          {isLogin ? "Đăng Nhập" : "Đăng Ký"}
        </h2>
        <form className="space-y-6">
          <div className="relative border-b border-slate-300 focus-within:border-[#dc2626] transition-colors">
            <label className="text-[11px] text-slate-500 font-bold uppercase">
              Email
            </label>
            <input
              type="email"
              placeholder="Nhập Email"
              className="w-full py-2 outline-none bg-transparent"
            />
          </div>
          <div className="relative border-b border-slate-300 focus-within:border-[#dc2626] transition-colors">
            <label className="text-[11px] text-slate-500 font-bold uppercase">
              Mật khẩu
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập Mật khẩu"
              className="w-full py-2 outline-none bg-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#dc2626] text-white font-bold py-4 rounded uppercase tracking-widest mt-4 hover:bg-red-700 transition-all"
          >
            Tiếp tục
          </button>
        </form>
      </div>
    </div>
  );
};
export default AuthModal;
