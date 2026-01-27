import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[600px]">
        <div className="hidden md:block w-1/2 bg-gray-900 relative">
          <img
            src="https://image.tmdb.org/t/p/original/mXLOHHc1Zeuwsl4xYKjKh2280oL.jpg"
            alt="Cinema Background"
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="relative z-10 p-12 h-full flex flex-col justify-end text-white">
            <h2 className="text-4xl font-extrabold mb-4">Chào mừng trở lại!</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Hàng ngàn bộ phim bom tấn đang chờ bạn. Đặt vé ngay hôm nay để
              không bỏ lỡ những khoảnh khắc tuyệt vời.
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
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Đăng nhập
              </h1>
              <p className="text-gray-500">
                Nhập thông tin của bạn để tiếp tục.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-[#0369a1] outline-none transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mật khẩu
                  </label>
                  <a
                    href="#"
                    className="text-sm font-semibold text-[#0369a1] hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-3.5 text-gray-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <button
                type="submit"
                className="w-full bg-[#0369a1] hover:bg-[#0284c7] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1"
              >
                Đăng nhập
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#0369a1] hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    className="w-5 h-5"
                    alt="Google"
                  />{" "}
                  Google
                </button>
                <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700">
                  <img
                    src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                    className="w-5 h-5"
                    alt="Facebook"
                  />{" "}
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
