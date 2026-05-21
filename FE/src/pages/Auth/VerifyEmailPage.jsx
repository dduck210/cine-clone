import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const FieldError = ({ msg }) => msg ? <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p> : null;

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError("Mã OTP gồm 6 chữ số");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/verify-email", { email, otp });
      toast.success("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
      navigate("/login", { state: { verifiedEmail: email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Xác thực thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      const res = await axiosInstance.post("/auth/resend-verify-otp", { email });
      toast.success(res.data.message || "OTP đã được gửi lại");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi lại OTP");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy email cần xác thực</h2>
          <p className="text-gray-500 mb-4">Vui lòng đăng ký tài khoản trước.</p>
          <Link to="/register" className="text-[#dc2626] font-bold hover:underline">Đi đến trang đăng ký</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Toaster position="top-center" />
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[540px]">
        {/* Left panel */}
        <div className="hidden md:block w-1/2 bg-gray-900 relative">
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
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative">
          <Link
            to="/login"
            className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={18} /> Quay lại đăng nhập
          </Link>

          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Kiểm tra email của bạn</h1>
              <p className="text-gray-500">
                Chúng tôi đã gửi mã OTP 6 chữ số đến{" "}
                <span className="font-semibold text-gray-700">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã OTP (6 chữ số)</label>
                <div className="relative">
                  <KeyRound className={`absolute left-4 top-3.5 ${error ? "text-red-400" : "text-gray-400"}`} size={20} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); if (error) setError(""); }}
                    placeholder="123456"
                    className={`w-full bg-gray-50 border rounded-xl pl-12 pr-4 py-3 focus:ring-2 outline-none transition-all font-medium tracking-widest text-center text-lg ${error ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-red-100 focus:border-[#dc2626]"}`}
                    disabled={isLoading}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <FieldError msg={error} />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all transform ${isLoading || otp.length !== 6 ? "bg-red-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 hover:-translate-y-1 shadow-red-200"}`}
              >
                {isLoading ? "Đang xác thực..." : "Xác thực email"}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-gray-500 text-sm">
                Không nhận được mã?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-bold text-[#dc2626] hover:underline disabled:text-red-300"
                >
                  {isResending ? "Đang gửi lại..." : "Gửi lại mã"}
                </button>
              </p>
              <p className="text-gray-400 text-xs">
                Vui lòng kiểm tra cả thư mục spam nếu không thấy email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
