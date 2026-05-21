import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, ShieldCheck } from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FieldError = ({ msg }) => msg ? (
  <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p>
) : null;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Họ tên không được để trống";
    else if (form.name.trim().length < 2) errs.name = "Họ tên phải có ít nhất 2 ký tự";
    if (!form.email.trim()) errs.email = "Email không được để trống";
    else if (!EMAIL_RE.test(form.email)) errs.email = "Email không đúng định dạng";
    if (!form.password) errs.password = "Mật khẩu không được để trống";
    else if (form.password.length < 6) errs.password = "Mật khẩu phải có ít nhất 6 ký tự";
    if (!form.confirmPassword) errs.confirmPassword = "Vui lòng nhập lại mật khẩu";
    else if (form.confirmPassword !== form.password) errs.confirmPassword = "Mật khẩu không khớp";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      // Clear any old session data to prevent auth conflicts
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      toast.success(res.data.message || "Vui lòng kiểm tra email để xác thực tài khoản.");
      navigate("/verify-email", { state: { email: res.data.email || form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng ký thất bại, thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Toaster position="top-center" />
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row">
        {/* Left panel — hidden on mobile */}
        <div className="hidden md:block md:w-1/2 bg-gray-900 relative min-h-[680px]">
          <img
            src="https://image.tmdb.org/t/p/original/mXLOHHc1Zeuwsl4xYKjKh2280oL.jpg"
            alt="Cinema Background"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="relative z-10 p-12 h-full flex flex-col justify-end text-white">
            <h2 className="text-4xl font-extrabold mb-4">Gia nhập 5Cine</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Tạo tài khoản ngay để tích điểm đổi quà, nhận ưu đãi độc quyền và đặt vé nhanh chóng.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-md mx-auto w-full">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium mb-8"
            >
              <ArrowLeft size={16} /> Về trang chủ
            </Link>

            <div className="mb-6 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Tạo tài khoản</h1>
              <p className="text-gray-500 text-sm sm:text-base">Hoàn toàn miễn phí và chỉ mất 1 phút.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                <div className="relative">
                  <User className={`absolute left-4 top-3.5 ${errors.name ? "text-red-400" : "text-gray-400"}`} size={18} />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={set("name")}
                    className={`w-full bg-gray-50 border rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 outline-none transition-all font-medium ${errors.name ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                  />
                </div>
                <FieldError msg={errors.name} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 ${errors.email ? "text-red-400" : "text-gray-400"}`} size={18} />
                  <input
                    type="text"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={set("email")}
                    className={`w-full bg-gray-50 border rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 outline-none transition-all font-medium ${errors.email ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                  />
                </div>
                <FieldError msg={errors.email} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-3.5 ${errors.password ? "text-red-400" : "text-gray-400"}`} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set("password")}
                    className={`w-full bg-gray-50 border rounded-xl pl-11 pr-12 py-3 text-sm focus:ring-2 outline-none transition-all font-medium ${errors.password ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldError msg={errors.password} />
                {form.password.length > 0 && form.password.length < 6 && !errors.password && (
                  <p className="text-amber-500 text-xs mt-1 ml-1">{form.password.length}/6 ký tự tối thiểu</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nhập lại mật khẩu</label>
                <div className="relative">
                  <ShieldCheck className={`absolute left-4 top-3.5 ${errors.confirmPassword ? "text-red-400" : "text-gray-400"}`} size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    className={`w-full bg-gray-50 border rounded-xl pl-11 pr-12 py-3 text-sm focus:ring-2 outline-none transition-all font-medium ${errors.confirmPassword ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldError msg={errors.confirmPassword} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 accent-[#dc2626] rounded border-gray-300 focus:ring-[#dc2626] shrink-0"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-500 leading-snug">
                  Tôi đồng ý với{" "}
                  <a href="#" className="text-[#dc2626] font-semibold hover:underline">
                    Điều khoản sử dụng
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#dc2626] hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Đã có tài khoản?{" "}
                <Link to="/login" className="font-bold text-[#dc2626] hover:underline">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
