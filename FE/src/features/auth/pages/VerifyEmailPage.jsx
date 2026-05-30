import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { verifyEmail, resendVerifyOtp } from "@/api/services/auth-service";

const COOLDOWN_SECONDS = 45;

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const email = location.state?.email || searchParams.get("email") || "";
  const codeFromUrl = searchParams.get("code") || "";
  const emailFailed = location.state?.emailFailed || false;

  const [otp, setOtp] = useState(codeFromUrl);
  const [touched, setTouched] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [serverError, setServerError] = useState("");
  const [resendStatus, setResendStatus] = useState(""); // "sent" | "error"
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const autoVerifiedRef = useRef(false);

  // Auto-verify khi code đến từ link email (one-time)
  useEffect(() => {
    if (codeFromUrl && email && !autoVerifiedRef.current) {
      autoVerifiedRef.current = true;
      setIsLoading(true);
      verifyEmail(email, codeFromUrl)
        .then(() => navigate("/login", { state: { verifiedEmail: email } }))
        .catch((err) => {
          const msg = err.response?.data?.message || "Xác thực thất bại";
          setServerError(msg);
          if (msg.includes("đã được xác thực") || msg.includes("không tồn tại")) {
            setTimeout(() => navigate("/login"), 2000);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Countdown gửi lại
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const validateOtp = (val) => {
    if (!val.trim() || val.length !== 6) return "Mã OTP gồm 6 chữ số";
    return "";
  };

  const handleOtpChange = (val) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setOtp(cleaned);
    setServerError("");
    setResendStatus("");
    if (touched) setOtpError(validateOtp(cleaned));
  };

  const handleBlur = () => {
    setTouched(true);
    setOtpError(validateOtp(otp));
  };

  const otpState = () => {
    if (!touched) return "idle";
    return otpError ? "error" : "success";
  };

  const inputClass = () => {
    const base = "w-full bg-gray-50 dark:bg-gray-700 border rounded-xl pl-12 pr-10 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 outline-none transition-all duration-200 font-medium tracking-widest text-center text-lg";
    const state = otpState();
    if (state === "error") return `${base} border-red-400 focus:ring-red-100 dark:focus:ring-red-900/20 focus:border-red-500`;
    if (state === "success") return `${base} border-green-400 focus:ring-green-100 dark:focus:ring-green-900/20 focus:border-green-500 bg-green-50/30 dark:bg-green-900/10`;
    return `${base} border-gray-200 dark:border-gray-600 focus:ring-red-100 dark:focus:ring-red-900/20 focus:border-[#dc2626]`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const err = validateOtp(otp);
    if (err) { setOtpError(err); setTouched(true); return; }
    setServerError("");
    setIsLoading(true);
    try {
      await verifyEmail(email, otp);
      navigate("/login", { state: { verifiedEmail: email } });
    } catch (err) {
      const msg = err.response?.data?.message || "Xác thực thất bại";
      setServerError(msg);
      if (msg.includes("đã được xác thực") || msg.includes("không tồn tại")) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setIsResending(true);
    setResendStatus("");
    setServerError("");
    try {
      await resendVerifyOtp(email);
      setResendStatus("sent");
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setResendStatus("error");
      setServerError(err.response?.data?.message || "Không thể gửi lại OTP");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy email cần xác thực</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Vui lòng đăng ký tài khoản trước.</p>
          <Link to="/register" className="text-[#dc2626] font-bold hover:underline">Đi đến trang đăng ký</Link>
        </div>
      </div>
    );
  }

  // Đang auto-verify từ link email
  if (codeFromUrl && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-w-md w-full p-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#dc2626] border-t-transparent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Đang xác thực email...</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Vui lòng đợi trong giây lát.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row">
        {/* Left panel */}
        <div className="hidden md:block md:w-1/2 bg-gray-900 relative min-h-[600px]">
          <img
            src="https://image.tmdb.org/t/p/original/mXLOHHc1Zeuwsl4xYKjKh2280oL.jpg"
            alt="Cinema Background"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="relative z-10 p-12 h-full flex flex-col justify-end text-white">
            <h2 className="text-4xl font-extrabold mb-4">Xác thực email</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Nhập mã OTP chúng tôi đã gửi đến email của bạn để hoàn tất đăng ký.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-md mx-auto w-full">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-sm font-medium mb-8"
            >
              <ArrowLeft size={18} /> Quay lại đăng nhập
            </Link>

            <div className="mb-8 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Kiểm tra email của bạn</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                Chúng tôi đã gửi mã OTP 6 chữ số đến{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span>
              </p>
            </div>

            {/* Cảnh báo gửi email thất bại từ RegisterPage */}
            {emailFailed && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm rounded-xl px-4 py-3 mb-5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>Không gửi được email OTP. Vui lòng dùng nút "Gửi lại mã" bên dưới.</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mã OTP (6 chữ số)</label>
                <div className="relative">
                  <KeyRound
                    className={`absolute left-4 top-3.5 ${otpState() === "error" ? "text-red-400" : otpState() === "success" ? "text-green-500" : "text-gray-400"}`}
                    size={20}
                  />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => handleOtpChange(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    className={inputClass()}
                    disabled={isLoading}
                    maxLength={6}
                    autoFocus
                  />
                  {otpState() === "success" && (
                    <CheckCircle size={16} className="absolute right-3.5 top-3.5 text-green-500 pointer-events-none" />
                  )}
                  {otpState() === "error" && (
                    <AlertCircle size={16} className="absolute right-3.5 top-3.5 text-red-400 pointer-events-none" />
                  )}
                </div>
                {otpError && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 ml-1 animate-[fadeDown_0.15s_ease]">
                    <AlertCircle size={11} className="shrink-0" />{otpError}
                  </p>
                )}
              </div>

              {/* Gửi lại thành công */}
              {resendStatus === "sent" && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl px-4 py-3 animate-[fadeDown_0.2s_ease]">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>OTP đã được gửi lại vào email của bạn!</span>
                </div>
              )}

              {/* Server error */}
              {serverError && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3 animate-[fadeDown_0.2s_ease]">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform ${
                  isLoading || otp.length !== 6
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-[#dc2626] hover:bg-red-700 hover:-translate-y-1 shadow-red-200"
                }`}
              >
                {isLoading ? "Đang xác thực..." : "Xác thực email"}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2 flex-wrap">
                Không nhận được mã?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending || cooldown > 0}
                  className="font-bold text-[#dc2626] hover:underline disabled:text-red-300 disabled:cursor-not-allowed"
                >
                  {isResending ? "Đang gửi lại..." : cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
                </button>
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">Vui lòng kiểm tra cả thư mục spam nếu không thấy email.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
