import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FieldError = ({ msg }) => msg ? (
  <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p>
) : null;

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email không được để trống";
    else if (!EMAIL_RE.test(email)) e.email = "Email không đúng định dạng";
    if (!password) e.password = "Mật khẩu không được để trống";
    else if (password.length < 6) e.password = "Mật khẩu phải có ít nhất 6 ký tự";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validate()) return;
    setIsLoading(true);
    toast.loading("Đang đăng nhập...", { id: "login" });
    try {
      const { data } = await axiosInstance.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      const user = { name: data.name, email: data.email, phone: data.phone || '', role: data.role, avatar: null };
      localStorage.setItem("currentUser", JSON.stringify(user));
      toast.success("Đăng nhập thành công!", { id: "login" });
      navigate(data.role === "admin" ? "/admin" : "/");
    } catch (err) {
      const msg = err.response?.data?.message || "Email hoặc mật khẩu không đúng";
      toast.error(msg, { id: "login" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row">
        {/* Left panel — hidden on mobile */}
        <div className="hidden md:block md:w-1/2 bg-gray-900 relative min-h-[600px]">
          <img
            src="https://image.tmdb.org/t/p/original/mXLOHHc1Zeuwsl4xYKjKh2280oL.jpg"
            alt="Cinema Background"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="relative z-10 p-12 h-full flex flex-col justify-end text-white">
            <h2 className="text-4xl font-extrabold mb-4">Chào mừng trở lại!</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Hàng ngàn bộ phim bom tấn đang chờ bạn. Đặt vé ngay hôm nay để không bỏ lỡ những khoảnh khắc tuyệt vời.
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

            <div className="mb-8 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Đăng nhập</h1>
              <p className="text-gray-500 text-sm sm:text-base">Nhập thông tin của bạn để tiếp tục.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 ${errors.email ? "text-red-400" : "text-gray-400"}`} size={18} />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: "" })); }}
                    placeholder="name@example.com"
                    className={`w-full bg-gray-50 border rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 outline-none transition-all font-medium ${errors.email ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                    disabled={isLoading}
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
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: "" })); }}
                    placeholder="••••••••"
                    className={`w-full bg-gray-50 border rounded-xl pl-11 pr-12 py-3 text-sm focus:ring-2 outline-none transition-all font-medium ${errors.password ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                    disabled={isLoading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <FieldError msg={errors.password} />
                <div className="mt-2 text-right">
                  <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-[#dc2626] transition-colors font-medium">
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform text-sm sm:text-base ${isLoading ? "bg-red-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 hover:-translate-y-0.5 shadow-red-200"}`}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Chưa có tài khoản?{" "}
                <Link to="/register" className="font-bold text-[#dc2626] hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
