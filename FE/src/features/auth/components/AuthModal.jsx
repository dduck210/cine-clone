import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "@/api/axiosConfig";

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "nam",
    dob: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng (VD: example@gmail.com)";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải chứa ít nhất 6 ký tự";
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = "Vui lòng nhập họ và tên";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Vui lòng nhập số điện thoại";
      } else if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone)) {
        newErrors.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại các thông tin chưa hợp lệ!", { id: "val-error" });
      return;
    }
    if (!isLogin && !agreeTerms) {
      toast.error("Bạn cần đồng ý với Điều khoản & Chính sách bảo mật!", { id: "val-error" });
      return;
    }

    setIsLoading(true);
    toast.loading("Đang xử lý...", { id: "auth-toast" });

    try {
      if (isLogin) {
        const { data } = await axiosInstance.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", data.token);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        const user = { name: data.name, email: data.email, role: data.role, avatar: null };
        localStorage.setItem("currentUser", JSON.stringify(user));
        toast.success("Đăng nhập thành công!", { id: "auth-toast" });
        if (onLoginSuccess) onLoginSuccess(user);
        setTimeout(onClose, 800);
      } else {
        await axiosInstance.post("/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.", { id: "auth-toast" });
        setIsLogin(true);
        setFormData({ name: "", email: formData.email, phone: "", gender: "nam", dob: "", password: "" });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại";
      toast.error(msg, { id: "auth-toast" });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({ name: "", email: "", phone: "", gender: "nam", dob: "", password: "" });
    setErrors({});
    setAgreeTerms(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        <button
          onClick={onClose}
          disabled={isLoading}
          className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all z-20 ${isLoading ? "bg-slate-50 text-slate-300 cursor-not-allowed" : "bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600"}`}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div className="overflow-y-auto custom-scrollbar flex-1 px-10 py-10">
          <div className="flex flex-col items-center mb-6 gap-2">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-[#dc2626] border border-red-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
              </svg>
            </div>
            <span className="text-2xl font-black text-[#dc2626] tracking-tight">5Cine</span>
          </div>

          <h2 className="text-[22px] font-bold text-slate-800 text-center mb-10 tracking-tight uppercase">
            {isLogin ? "Đăng Nhập Tài Khoản" : "Đăng Ký Tài Khoản"}
          </h2>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="relative w-full">
                <label className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 ${errors.name ? "text-red-500" : "text-slate-500"}`}>
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Nhập Họ và tên"
                  className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.name ? "border-red-500" : "border-slate-300"}`}
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.name}</p>}
              </div>
            )}

            <div className="relative w-full">
              <label className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 ${errors.email ? "text-red-500" : "text-slate-500"}`}>
                Email
              </label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                type="text"
                placeholder="Nhập Email"
                className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? "border-red-500" : "border-slate-300"}`}
              />
              {errors.email && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.email}</p>}
            </div>

            {!isLogin && (
              <div className="relative w-full">
                <label className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 ${errors.phone ? "text-red-500" : "text-slate-500"}`}>
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Nhập Số điện thoại"
                  className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.phone ? "border-red-500" : "border-slate-300"}`}
                />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.phone}</p>}
              </div>
            )}

            <div className={`relative w-full ${isLogin ? "mt-8" : ""}`}>
              <label className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 z-10 ${errors.password ? "text-red-500" : "text-slate-500"}`}>
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập Mật khẩu"
                  className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.password ? "border-red-500" : "border-slate-300"}`}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 w-4 h-4 accent-[#dc2626] cursor-pointer rounded shrink-0 disabled:opacity-50"
                />
                <label htmlFor="terms" className={`text-xs leading-snug select-none ${isLoading ? "text-slate-400 cursor-not-allowed" : "text-slate-600 cursor-pointer"}`}>
                  Tôi đồng ý với{" "}
                  <span className={`${isLoading ? "text-red-300" : "text-[#dc2626] hover:underline"} font-bold`}>Điều khoản</span>
                  {" "}&{" "}
                  <span className={`${isLoading ? "text-red-300" : "text-[#dc2626] hover:underline"} font-bold`}>Chính sách</span>.
                </label>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white font-bold py-3.5 rounded-xl transition-all text-[15px] uppercase tracking-wide shadow-md flex items-center justify-center gap-2 ${
                  isLoading ? "bg-red-400 shadow-none cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 shadow-red-200"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : isLogin ? (
                  "Đăng Nhập"
                ) : (
                  "Hoàn Thành"
                )}
              </button>
            </div>

            {isLogin && (
              <div className="text-left -mt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  className={`text-sm transition-colors ${isLoading ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-[#dc2626] hover:underline"}`}
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}
          </form>

          <div className="mt-8">
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <p className={`text-sm ${isLoading ? "text-slate-400" : "text-slate-600"}`}>
                {isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}
              </p>
              <button
                onClick={switchMode}
                disabled={isLoading}
                className={`w-full py-3 border-2 font-bold rounded-xl transition-all text-[15px] uppercase ${
                  isLoading ? "border-red-200 text-red-200 cursor-not-allowed bg-transparent" : "border-[#dc2626] text-[#dc2626] hover:bg-red-50 bg-white"
                }`}
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
