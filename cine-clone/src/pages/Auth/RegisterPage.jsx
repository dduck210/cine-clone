import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from "lucide-react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px]">
        <div className="hidden md:block w-1/2 bg-gray-900 relative">
          <img
            src="https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vREc0547OTqEv.jpg"
            alt="Cinema Background"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="relative z-10 p-12 h-full flex flex-col justify-end text-white">
            <h2 className="text-4xl font-extrabold mb-4">Gia nhập 5Cine</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Tạo tài khoản ngay để tích điểm đổi quà, nhận ưu đãi độc quyền và
              đặt vé nhanh chóng.
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center relative">
          <Link
            to="/"
            className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={18} /> Về trang chủ
          </Link>

          <div className="max-w-md mx-auto w-full">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Tạo tài khoản
              </h1>
              <p className="text-gray-500">
                Hoàn toàn miễn phí và chỉ mất 1 phút.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-3.5 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-[#0369a1] outline-none transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-3.5 text-gray-400"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-[#0369a1] outline-none transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-3.5 text-gray-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-12 py-3 focus:ring-2 focus:ring-blue-100 focus:border-[#0369a1] outline-none transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="w-4 h-4 text-[#0369a1] rounded border-gray-300 focus:ring-[#0369a1]"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-500">
                  Tôi đồng ý với{" "}
                  <a
                    href="#"
                    className="text-[#0369a1] font-semibold hover:underline"
                  >
                    Điều khoản sử dụng
                  </a>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0369a1] hover:bg-[#0284c7] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1"
              >
                Đăng ký
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="font-bold text-[#0369a1] hover:underline"
                >
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
