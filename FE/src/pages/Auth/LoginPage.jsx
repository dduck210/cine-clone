import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateField = (name, value) => {
  if (name === "email") {
    if (!value.trim()) return "Email không được để trống";
    if (!EMAIL_RE.test(value)) return "Email không đúng định dạng";
    return "";
  }
  if (name === "password") {
    if (!value) return "Mật khẩu không được để trống";
    if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    return "";
  }
  return "";
};

const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 ml-1 animate-[fadeDown_0.15s_ease]">
      <AlertCircle size={11} className="shrink-0" />
      {msg}
    </p>
  ) : null;

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = useCallback(
    (name, value) => {
      setFields((prev) => ({ ...prev, [name]: value }));
      if (serverError) setServerError("");
      // Validate live chỉ sau khi field đã bị touched
      if (touched[name]) {
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
      }
    },
    [touched, serverError]
  );

  const handleBlur = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, fields[name]) }));
    },
    [fields]
  );

  const validateAll = () => {
    const e = {
      email: validateField("email", fields.email),
      password: validateField("password", fields.password),
    };
    setErrors(e);
    setTouched({ email: true, password: true });
    return !e.email && !e.password;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!validateAll()) return;
    setIsLoading(true);
    setServerError("");
    try {
      const { data } = await axiosInstance.post("/auth/login", {
        email: fields.email,
        password: fields.password,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ name: data.name, email: data.email, phone: data.phone || "", role: data.role, avatar: null })
      );
      toast.success("Đăng nhập thành công!");
      navigate(data.role === "admin" ? "/admin" : "/");
    } catch (err) {
      const msg = err.response?.data?.message || "Email hoặc mật khẩu không đúng";
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Trả về: "idle" | "error" | "success"
  const fieldState = (name) => {
    if (!touched[name]) return "idle";
    return errors[name] ? "error" : "success";
  };

  const inputClass = (name, extraRight = "pr-10") => {
    const base = `w-full bg-gray-50 border rounded-xl pl-11 ${extraRight} py-3 text-sm focus:ring-2 outline-none transition-all duration-200 font-medium`;
    const state = fieldState(name);
    if (state === "error") return `${base} border-red-400 focus:ring-red-100 focus:border-red-500`;
    if (state === "success") return `${base} border-green-400 focus:ring-green-100 focus:border-green-500 bg-green-50/30`;
    return `${base} border-gray-200 focus:ring-red-100 focus:border-[#dc2626]`;
  };

  const leadIconColor = (name) => {
    const state = fieldState(name);
    if (state === "error") return "text-red-400";
    if (state === "success") return "text-green-500";
    return "text-gray-400";
  };

  const TrailIcon = ({ name }) => {
    const state = fieldState(name);
    if (state === "success")
      return <CheckCircle size={16} className="absolute right-3.5 top-3.5 text-green-500 pointer-events-none" />;
    if (state === "error")
      return <AlertCircle size={16} className="absolute right-3.5 top-3.5 text-red-400 pointer-events-none" />;
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row">
        {/* Left panel */}
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
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 ${leadIconColor("email")}`} size={18} />
                  <input
                    type="text"
                    value={fields.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="name@example.com"
                    className={inputClass("email")}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  <TrailIcon name="email" />
                </div>
                <FieldError msg={errors.email} />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-3.5 ${leadIconColor("password")}`} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={fields.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="••••••••"
                    className={inputClass("password", "pr-20")}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  {/* Trail: status icon + toggle */}
                  <div className="absolute right-3.5 top-3 flex items-center gap-1.5">
                    {fieldState("password") === "success" && (
                      <CheckCircle size={16} className="text-green-500 pointer-events-none" />
                    )}
                    {fieldState("password") === "error" && (
                      <AlertCircle size={16} className="text-red-400 pointer-events-none" />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <FieldError msg={errors.password} />
                <div className="mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-gray-400 hover:text-[#dc2626] transition-colors font-medium"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 animate-[fadeDown_0.2s_ease]">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform text-sm sm:text-base ${
                  isLoading
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-[#dc2626] hover:bg-red-700 hover:-translate-y-0.5 shadow-red-200"
                }`}
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
