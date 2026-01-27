import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const loadingToast = toast.loading("Đang xử lý...");

    setTimeout(() => {
      toast.dismiss(loadingToast);

      if (isLogin) {
        if (
          formData.email === "admin@gmail.com" &&
          formData.password === "123456"
        ) {
          toast.success("Đăng nhập thành công!");
          if (onLoginSuccess) {
            onLoginSuccess({
              name: "Dương Anh Đức",
              avatar:
                "https://ui-avatars.com/api/?name=Duong+Anh+Duc&background=random",
              rank: "Star",
              points: 0,
            });
          }
          setTimeout(onClose, 1000);
        } else {
          toast.error("Tài khoản hoặc mật khẩu không đúng!");
        }
      } else {
        toast.success("Đăng ký thành công!");
        setIsLogin(true);
      }
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 font-bromega font-bold">
      <Toaster position="top-center" containerStyle={{ zIndex: 100000 }} />

      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-xl shadow-2xl w-[400px] h-fit max-h-[98vh] overflow-hidden animate-scale-up flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-400 transition-all z-20"
        >
          <X size={16} />
        </button>

        <div className="p-5 flex-1 overflow-hidden">
          <div className="flex justify-center mb-2">
            <img
              src="https://www.galaxycine.vn/_next/static/media/icon-login.fbbf1b2d.svg"
              alt="Mascot"
              className="h-20 w-auto object-contain"
            />
          </div>

          <h2 className="text-lg font-bold text-gray-700 text-center mb-4 uppercase tracking-tight">
            {isLogin ? "Đăng Nhập Tài Khoản" : "Đăng Ký Tài Khoản"}
          </h2>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-0.5">
                <label className="text-[10px] text-gray-500 ml-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  placeholder="Nhập Họ và tên"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:border-blue-400 outline-none"
                />
              </div>
            )}

            <div className="space-y-0.5">
              <label className="text-[10px] text-gray-500 ml-1">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="Nhập Email"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:border-blue-400 outline-none"
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-0.5">
                  <label className="text-[10px] text-gray-500 ml-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="Nhập Số điện thoại"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:border-blue-400 outline-none"
                  />
                </div>

                <div className="flex gap-4 py-0.5 ml-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                    <input
                      type="radio"
                      name="gender"
                      className="w-3.5 h-3.5 accent-orange-500"
                    />{" "}
                    Nam
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                    <input
                      type="radio"
                      name="gender"
                      className="w-3.5 h-3.5 accent-orange-500"
                    />{" "}
                    Nữ
                  </label>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-gray-500 ml-1">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ngày/Tháng/Năm"
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs outline-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400 border-l pl-1.5">
                      <Calendar size={14} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-0.5">
              <label className="text-[10px] text-gray-500 ml-1">Mật khẩu</label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập Mật khẩu"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs focus:border-blue-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-2 py-1">
                <input
                  type="checkbox"
                  className="mt-0.5 w-3.5 h-3.5 accent-gray-800"
                  id="terms"
                />
                <label
                  htmlFor="terms"
                  className="text-[10px] text-gray-600 leading-[1.2] italic font-normal"
                >
                  Tôi đồng ý với{" "}
                  <span className="text-blue-500 not-italic cursor-pointer">
                    Điều khoản
                  </span>{" "}
                  &{" "}
                  <span className="text-blue-500 not-italic cursor-pointer">
                    Chính sách
                  </span>
                  .
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#D39B7D] hover:bg-[#c68e73] text-white font-bold py-3 rounded-md transition-all shadow-md uppercase tracking-wider text-xs"
            >
              {isLogin ? "Đăng Nhập" : "Hoàn Thành"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-2 font-bold">
              {isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: "", password: "" });
              }}
              className="w-full py-2 border border-orange-400 text-orange-400 font-bold rounded-md hover:bg-orange-50 transition-all text-xs"
            >
              {isLogin ? "Đăng ký" : "Đăng nhập"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
