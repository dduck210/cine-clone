import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateField = (name, value, allValues = {}) => {
  if (name === "name") {
    if (!value.trim()) return "Họ tên không được để trống";
    if (value.trim().length < 2) return "Họ tên phải có ít nhất 2 ký tự";
    return "";
  }
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
  if (name === "confirmPassword") {
    if (!value) return "Vui lòng nhập lại mật khẩu";
    if (value !== allValues.password) return "Mật khẩu không khớp";
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");

  const handleChange = useCallback(
    (name, value) => {
      const updated = { ...fields, [name]: value };
      setFields(updated);
      if (serverError) setServerError("");
      const newErrors = { ...errors };
      if (touched[name]) {
        newErrors[name] = validateField(name, value, updated);
      }
      // Re-validate confirmPassword live khi password thay đổi
      if (name === "password" && touched.confirmPassword) {
        newErrors.confirmPassword = validateField("confirmPassword", updated.confirmPassword, updated);
      }
      setErrors(newErrors);
    },
    [fields, errors, touched, serverError]
  );

  const handleBlur = useCallback(
    (name) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, fields[name], fields) }));
    },
    [fields]
  );

  const validateAll = () => {
    const e = {
      name: validateField("name", fields.name, fields),
      email: validateField("email", fields.email, fields),
      password: validateField("password", fields.password, fields),
      confirmPassword: validateField("confirmPassword", fields.confirmPassword, fields),
    };
    setErrors(e);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    return Object.values(e).every((v) => !v);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await axiosInstance.post("/auth/register", {
        name: fields.name,
        email: fields.email,
        password: fields.password,
      });
      localStorage.removeItem("token");
      localStorage.removeItem("currentUser");
      toast.success(res.data.message || "Vui lòng kiểm tra email để xác thực tài khoản.");
      navigate("/verify-email", {
        state: { email: res.data.email || fields.email, emailFailed: !!res.data.emailFailed },
      });
    } catch (err) {
      setServerError(err.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  const fieldState = (name) => {
    if (!touched[name]) return "idle";
    return errors[name] ? "error" : "success";
  };

  const inputClass = (name, extraRight = "pr-10") => {
    const base = `w-full bg-gray-50 border rounded-xl pl-11 ${extraRight} py-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all duration-200 font-medium`;
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
    if (state === "success") return <CheckCircle size={16} className="text-green-500 pointer-events-none" />;
    if (state === "error") return <AlertCircle size={16} className="text-red-400 pointer-events-none" />;
    return null;
  };

  // Ô password/confirmPassword có thêm nút toggle nên trail phức tạp hơn
  const PasswordTrail = ({ name, show, onToggle }) => (
    <div className="absolute right-3.5 top-3 flex items-center gap-1.5">
      <TrailIcon name={name} />
      <button type="button" onClick={onToggle} className="text-gray-400 hover:text-gray-600 p-0.5" tabIndex={-1}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

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
            <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium mb-8">
              <ArrowLeft size={16} /> Về trang chủ
            </Link>

            <div className="mb-6 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Tạo tài khoản</h1>
              <p className="text-gray-500 text-sm sm:text-base">Hoàn toàn miễn phí và chỉ mất 1 phút.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                <div className="relative">
                  <User className={`absolute left-4 top-3.5 ${leadIconColor("name")}`} size={18} />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fields.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    className={inputClass("name")}
                    autoComplete="name"
                  />
                  <div className="absolute right-3.5 top-3.5"><TrailIcon name="name" /></div>
                </div>
                <FieldError msg={errors.name} />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-3.5 ${leadIconColor("email")}`} size={18} />
                  <input
                    type="text"
                    placeholder="name@example.com"
                    value={fields.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={inputClass("email")}
                    autoComplete="email"
                  />
                  <div className="absolute right-3.5 top-3.5"><TrailIcon name="email" /></div>
                </div>
                <FieldError msg={errors.email} />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-3.5 ${leadIconColor("password")}`} size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={fields.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={inputClass("password", "pr-20")}
                    autoComplete="new-password"
                  />
                  <PasswordTrail name="password" show={showPassword} onToggle={() => setShowPassword((p) => !p)} />
                </div>
                <FieldError msg={errors.password} />
                {fields.password.length > 0 && fields.password.length < 6 && !errors.password && (
                  <p className="text-amber-500 text-xs mt-1.5 ml-1">{fields.password.length}/6 ký tự tối thiểu</p>
                )}
              </div>

              {/* Nhập lại mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nhập lại mật khẩu</label>
                <div className="relative">
                  <ShieldCheck className={`absolute left-4 top-3.5 ${leadIconColor("confirmPassword")}`} size={18} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={fields.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={inputClass("confirmPassword", "pr-20")}
                    autoComplete="new-password"
                  />
                  <PasswordTrail name="confirmPassword" show={showConfirmPassword} onToggle={() => setShowConfirmPassword((p) => !p)} />
                </div>
                <FieldError msg={errors.confirmPassword} />
              </div>

              {/* Terms */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 accent-[#dc2626] rounded border-gray-300 focus:ring-[#dc2626] shrink-0"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-500 leading-snug">
                  Tôi đồng ý với{" "}
                  <Link to="/terms" target="_blank" className="text-[#dc2626] font-semibold hover:underline">
                    Điều khoản sử dụng
                  </Link>
                </label>
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
                disabled={loading}
                className="w-full bg-[#dc2626] hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm sm:text-base"
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
