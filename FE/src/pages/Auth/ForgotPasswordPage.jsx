import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowLeft, KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { authService } from "../../api/services";
import { validateEmail, validatePassword } from "../../shared/utils";

const validateField = (name, value, allValues = {}) => {
  if (name === "email") return validateEmail(value);
  if (name === "otp") {
    if (!value.trim() || value.length !== 6) return "Mã OTP gồm 6 chữ số";
    return "";
  }
  if (name === "newPassword") return validatePassword(value);
  if (name === "confirmPassword") {
    if (!value) return "Vui lòng xác nhận mật khẩu";
    if (value !== allValues.newPassword) return "Mật khẩu xác nhận không khớp";
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

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState({
    email: searchParams.get("email") || "",
    otp: searchParams.get("code") || "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [otpPreFilled, setOtpPreFilled] = useState(false);

  // Auto-advance to step 2 when URL has both email + code
  useEffect(() => {
    if (searchParams.get("code") && searchParams.get("email")) {
      setStep(2);
      setOtpPreFilled(true);
    }
  }, []);

  const handleChange = useCallback(
    (name, value) => {
      const updated = { ...fields, [name]: value };
      setFields(updated);
      if (serverError) setServerError("");
      const newErrors = { ...errors };
      if (touched[name]) newErrors[name] = validateField(name, value, updated);
      // Re-validate confirmPassword khi newPassword thay đổi
      if (name === "newPassword" && touched.confirmPassword) {
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

  const fieldState = (name) => {
    if (!touched[name]) return "idle";
    return errors[name] ? "error" : "success";
  };

  const inputClass = (name, extra = "pr-10") => {
    const base = `w-full bg-gray-50 dark:bg-gray-700 border rounded-xl pl-12 ${extra} py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 outline-none transition-all duration-200 font-medium`;
    const state = fieldState(name);
    if (state === "error") return `${base} border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20 focus:border-red-500`;
    if (state === "success") return `${base} border-green-400 focus:ring-green-100 dark:focus:ring-green-900/20 focus:border-green-500 bg-green-50/30 dark:bg-green-900/10`;
    return `${base} border-gray-200 dark:border-gray-600 focus:ring-red-100 dark:focus:ring-red-900/20 focus:border-[#dc2626]`;
  };

  const leadIconColor = (name) => {
    const state = fieldState(name);
    if (state === "error") return "text-red-400";
    if (state === "success") return "text-green-500";
    return "text-gray-400";
  };

  const TrailIcon = ({ name }) => {
    const state = fieldState(name);
    if (state === "success") return <CheckCircle size={16} className="absolute right-3.5 top-3.5 text-green-500 pointer-events-none" />;
    if (state === "error") return <AlertCircle size={16} className="absolute right-3.5 top-3.5 text-red-400 pointer-events-none" />;
    return null;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const err = validateField("email", fields.email);
    if (err) {
      setErrors({ email: err });
      setTouched({ email: true });
      return;
    }
    setIsLoading(true);
    setServerError("");
    try {
      await authService.forgotPassword(fields.email);
      setStep(2);
      setErrors({});
      setTouched({});
    } catch (err) {
      setServerError(err.response?.data?.message || "Không thể gửi OTP, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const e1 = validateField("otp", fields.otp);
    const e2 = validateField("newPassword", fields.newPassword);
    const e3 = validateField("confirmPassword", fields.confirmPassword, fields);
    if (e1 || e2 || e3) {
      setErrors({ otp: e1, newPassword: e2, confirmPassword: e3 });
      setTouched({ otp: true, newPassword: true, confirmPassword: true });
      return;
    }
    setIsLoading(true);
    setServerError("");
    try {
      await authService.resetPassword(fields.email, fields.otp, fields.newPassword);
      navigate("/login");
    } catch (err) {
      setServerError(err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn");
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToStep1 = () => {
    setStep(1);
    setErrors({});
    setTouched({});
    setServerError("");
    setOtpPreFilled(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px]">
        {/* Left panel */}
        <div className="hidden md:block w-1/2 bg-gray-900 relative">
          <img
            src="https://image.tmdb.org/t/p/original/mXLOHHc1Zeuwsl4xYKjKh2280oL.jpg"
            alt="Cinema Background"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="relative z-10 p-12 h-full flex flex-col justify-end text-white">
            <h2 className="text-4xl font-extrabold mb-4">Quên mật khẩu?</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Đừng lo! Chúng tôi sẽ gửi mã OTP đến email của bạn để đặt lại mật khẩu an toàn.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative">
          <Link
            to="/login"
            className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={18} /> Quay lại đăng nhập
          </Link>

          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Đặt lại mật khẩu</h1>
              <p className="text-gray-500 dark:text-gray-400">
                {step === 1 ? "Nhập email để nhận mã OTP xác nhận." : `Nhập mã OTP đã gửi đến ${fields.email}`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-[#dc2626] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"}`}>
                    {s}
                  </div>
                  {s < 2 && <div className={`flex-1 h-1 rounded transition-all ${step > s ? "bg-[#dc2626]" : "bg-gray-100 dark:bg-gray-700"}`} />}
                </React.Fragment>
              ))}
            </div>

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-3.5 ${leadIconColor("email")}`} size={20} />
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

                {serverError && (
                  <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 animate-[fadeDown_0.2s_ease]">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform ${isLoading ? "bg-red-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 hover:-translate-y-1 shadow-red-200"}`}
                >
                  {isLoading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {otpPreFilled && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl px-4 py-3">
                    <CheckCircle size={16} className="shrink-0" />
                    <span>Đã điền mã OTP từ email!</span>
                  </div>
                )}

                {/* OTP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mã OTP (6 chữ số)</label>
                  <div className="relative">
                    <KeyRound className={`absolute left-4 top-3.5 ${leadIconColor("otp")}`} size={20} />
                    <input
                      type="text"
                      value={fields.otp}
                      onChange={(e) => handleChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onBlur={() => handleBlur("otp")}
                      placeholder="123456"
                      autoComplete="one-time-code"
                      className={`${inputClass("otp")} tracking-widest text-center text-lg`}
                      disabled={isLoading}
                      maxLength={6}
                    />
                    <TrailIcon name="otp" />
                  </div>
                  <FieldError msg={errors.otp} />
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-3.5 ${leadIconColor("newPassword")}`} size={20} />
                    <input
                      type="password"
                      value={fields.newPassword}
                      onChange={(e) => handleChange("newPassword", e.target.value)}
                      onBlur={() => handleBlur("newPassword")}
                      placeholder="••••••••"
                      className={inputClass("newPassword")}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <TrailIcon name="newPassword" />
                  </div>
                  <FieldError msg={errors.newPassword} />
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-3.5 ${leadIconColor("confirmPassword")}`} size={20} />
                    <input
                      type="password"
                      value={fields.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      onBlur={() => handleBlur("confirmPassword")}
                      placeholder="••••••••"
                      className={inputClass("confirmPassword")}
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <TrailIcon name="confirmPassword" />
                  </div>
                  <FieldError msg={errors.confirmPassword} />
                </div>

                {serverError && (
                  <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 animate-[fadeDown_0.2s_ease]">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform ${isLoading ? "bg-red-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 hover:-translate-y-1 shadow-red-200"}`}
                >
                  {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>

                <button
                  type="button"
                  onClick={goBackToStep1}
                  className="w-full text-gray-500 dark:text-gray-400 text-sm hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Đổi email khác
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
