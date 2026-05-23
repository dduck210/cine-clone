import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowLeft, KeyRound } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FieldError = ({ msg }) => msg ? <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p> : null;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState(searchParams.get("code") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Cleanup toasts on unmount
  useEffect(() => {
    return () => { toast.dismiss("otp"); toast.dismiss("reset"); };
  }, []);

  // Auto-fill from email link
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    const emailFromUrl = searchParams.get("email");
    if (codeFromUrl && emailFromUrl) {
      setStep(2);
      toast.success("Đã điền mã OTP từ email!", { duration: 2000 });
    }
  }, []);

  const validateStep1 = () => {
    const e = {};
    if (!email.trim()) e.email = "Email không được để trống";
    else if (!EMAIL_RE.test(email)) e.email = "Email không đúng định dạng";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!otp.trim() || otp.length !== 6) e.otp = "Mã OTP gồm 6 chữ số";
    if (!newPassword) e.newPassword = "Mật khẩu không được để trống";
    else if (newPassword.length < 6) e.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
    if (confirmPassword !== newPassword) e.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setIsLoading(true);
    toast.loading("Đang gửi OTP...", { id: "otp" });
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      toast.success("OTP đã được gửi tới email của bạn!", { id: "otp" });
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi OTP", { id: "otp" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setIsLoading(true);
    toast.loading("Đang đặt lại mật khẩu...", { id: "reset" });
    try {
      await axiosInstance.post("/auth/reset-password", { email, otp, newPassword });
      toast.success("Đặt lại mật khẩu thành công!", { id: "reset" });
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn", { id: "reset" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px]">
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
            className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={18} /> Quay lại đăng nhập
          </Link>

          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Đặt lại mật khẩu</h1>
              <p className="text-gray-500">
                {step === 1
                  ? "Nhập email để nhận mã OTP xác nhận."
                  : `Nhập mã OTP đã gửi đến ${email}`}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? "bg-[#dc2626] text-white" : "bg-gray-100 text-gray-400"}`}>
                    {s}
                  </div>
                  {s < 2 && <div className={`flex-1 h-1 rounded transition-all ${step > s ? "bg-[#dc2626]" : "bg-gray-100"}`} />}
                </React.Fragment>
              ))}
            </div>

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className={`absolute left-4 top-3.5 ${errors.email ? "text-red-400" : "text-gray-400"}`} size={20} />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: "" })); }}
                      placeholder="name@example.com"
                      className={`w-full bg-gray-50 border rounded-xl pl-12 pr-4 py-3 focus:ring-2 outline-none transition-all font-medium ${errors.email ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                      disabled={isLoading}
                    />
                  </div>
                  <FieldError msg={errors.email} />
                </div>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mã OTP (6 chữ số)</label>
                  <div className="relative">
                    <KeyRound className={`absolute left-4 top-3.5 ${errors.otp ? "text-red-400" : "text-gray-400"}`} size={20} />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); if (errors.otp) setErrors((p) => ({ ...p, otp: "" })); }}
                      placeholder="123456"
                      autocomplete="one-time-code"
                      className={`w-full bg-gray-50 border rounded-xl pl-12 pr-4 py-3 focus:ring-2 outline-none transition-all font-medium tracking-widest text-center text-lg ${errors.otp ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                      disabled={isLoading}
                      maxLength={6}
                    />
                  </div>
                  <FieldError msg={errors.otp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-3.5 ${errors.newPassword ? "text-red-400" : "text-gray-400"}`} size={20} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: "" })); }}
                      placeholder="••••••••"
                      className={`w-full bg-gray-50 border rounded-xl pl-12 pr-4 py-3 focus:ring-2 outline-none transition-all font-medium ${errors.newPassword ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                      disabled={isLoading}
                    />
                  </div>
                  <FieldError msg={errors.newPassword} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-3.5 ${errors.confirmPassword ? "text-red-400" : "text-gray-400"}`} size={20} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                      placeholder="••••••••"
                      className={`w-full bg-gray-50 border rounded-xl pl-12 pr-4 py-3 focus:ring-2 outline-none transition-all font-medium ${errors.confirmPassword ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                      disabled={isLoading}
                    />
                  </div>
                  <FieldError msg={errors.confirmPassword} />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform ${isLoading ? "bg-red-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 hover:-translate-y-1 shadow-red-200"}`}
                >
                  {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-500 text-sm hover:text-red-600 transition-colors"
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
