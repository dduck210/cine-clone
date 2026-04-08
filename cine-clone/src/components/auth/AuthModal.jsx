import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "nam",
    dob: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng (VD: example@gmail.com)";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải chứa ít nhất 6 ký tự";
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = "Vui lòng nhập họ và tên";
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Vui lòng nhập số điện thoại";
      } else if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone)) {
        newErrors.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)";
      }

      if (!formData.dob.trim()) {
        newErrors.dob = "Vui lòng nhập ngày sinh";
      } else if (
        !/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/.test(
          formData.dob,
        )
      ) {
        newErrors.dob = "Ngày sinh phải đúng định dạng DD/MM/YYYY";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Chặn không cho gọi hàm nếu đang xử lý
    if (isLoading) return;

    if (!validateForm()) {
      // THÊM ID ĐỂ CHỐNG ĐẺ RA 10 CÁI TOAST
      toast.error("Vui lòng kiểm tra lại các thông tin chưa hợp lệ!", {
        id: "val-error",
      });
      return;
    }

    if (!isLogin && !agreeTerms) {
      toast.error("Bạn cần đồng ý với Điều khoản & Chính sách bảo mật!", {
        id: "val-error",
      });
      return;
    }

    // Bật Loading khi bắt đầu call API
    setIsLoading(true);
    const loadingToast = toast.loading("Đang xử lý...", { id: "auth-toast" });

    setTimeout(() => {
      // Tắt Loading
      setIsLoading(false);

      if (isLogin) {
        if (
          formData.email === "admin@gmail.com" &&
          formData.password === "123456"
        ) {
          toast.success("Đăng nhập thành công!", { id: "auth-toast" });
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
          toast.error("Tài khoản hoặc mật khẩu không đúng!", {
            id: "auth-toast",
          });
        }
      } else {
        toast.success("Đăng ký thành công!", { id: "auth-toast" });
        setIsLogin(true);
      }
    }, 1500); // Test vòng xoay 1.5s cho đẹp
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: "",
      email: "",
      phone: "",
      gender: "nam",
      dob: "",
      password: "",
    });
    setErrors({});
    setAgreeTerms(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
      <Toaster position="top-center" containerStyle={{ zIndex: 100000 }} />

      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        <button
          onClick={onClose}
          disabled={isLoading}
          className={`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all z-20 ${isLoading ? "bg-slate-50 text-slate-300 cursor-not-allowed" : "bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600"}`}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div className="overflow-y-auto custom-scrollbar flex-1 px-10 py-10">
          <div className="flex justify-center mb-6">
            <img
              src="https://www.galaxycine.vn/_next/static/media/icon-login.fbbf1b2d.svg"
              alt="Login Mascot"
              className="h-28 w-auto object-contain"
            />
          </div>

          <h2 className="text-[22px] font-bold text-slate-800 text-center mb-10 tracking-tight uppercase">
            {isLogin ? "Đăng Nhập Tài Khoản" : "Đăng Ký Tài Khoản"}
          </h2>

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="relative w-full">
                <label
                  className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 ${errors.name ? "text-red-500" : "text-slate-500"}`}
                >
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Nhập Họ và tên"
                  className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.name ? "border-red-500" : "border-slate-300"}`}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-500 mt-1.5 font-medium">
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            <div className="relative w-full">
              <label
                className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 ${errors.email ? "text-red-500" : "text-slate-500"}`}
              >
                Email
              </label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                type="text"
                placeholder="Nhập Email"
                className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.email ? "border-red-500" : "border-slate-300"}`}
              />
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1.5 font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            {!isLogin && (
              <>
                <div className="relative w-full">
                  <label
                    className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 ${errors.phone ? "text-red-500" : "text-slate-500"}`}
                  >
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Nhập Số điện thoại"
                    className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.phone ? "border-red-500" : "border-slate-300"}`}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-500 mt-1.5 font-medium">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="flex gap-10 py-1 mt-2">
                  <label
                    className={`flex items-center gap-2 text-sm font-medium ${isLoading ? "text-slate-400 cursor-not-allowed" : "text-slate-700 cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value="nam"
                      checked={formData.gender === "nam"}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-4 h-4 accent-[#dc2626] cursor-pointer disabled:opacity-50"
                    />{" "}
                    Nam
                  </label>
                  <label
                    className={`flex items-center gap-2 text-sm font-medium ${isLoading ? "text-slate-400 cursor-not-allowed" : "text-slate-700 cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value="nu"
                      checked={formData.gender === "nu"}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-4 h-4 accent-[#dc2626] cursor-pointer disabled:opacity-50"
                    />{" "}
                    Nữ
                  </label>
                </div>

                <div className="relative w-full mt-6">
                  <label
                    className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 z-10 ${errors.dob ? "text-red-500" : "text-slate-500"}`}
                  >
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      disabled={isLoading}
                      placeholder="DD/MM/YYYY"
                      className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.dob ? "border-red-500" : "border-slate-300"}`}
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center text-slate-400 pointer-events-none">
                      <Calendar size={18} />
                    </div>
                  </div>
                  {errors.dob && (
                    <p className="text-[11px] text-red-500 mt-1.5 font-medium">
                      {errors.dob}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className={`relative w-full ${isLogin ? "mt-8" : "mt-8"}`}>
              <label
                className={`absolute -top-3 left-0 text-[11px] font-semibold bg-white pr-2 z-10 ${errors.password ? "text-red-500" : "text-slate-500"}`}
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập Mật khẩu"
                  className={`w-full border-0 border-b px-0 py-2.5 text-[15px] text-slate-800 focus:ring-0 focus:border-[#dc2626] transition-colors placeholder:text-slate-300 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed ${errors.password ? "border-red-500" : "border-slate-300"}`}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-500 mt-1.5 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            {!isLogin && (
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 w-4 h-4 accent-[#dc2626] cursor-pointer rounded shrink-0 disabled:opacity-50"
                />
                <label
                  htmlFor="terms"
                  className={`text-xs leading-snug select-none ${isLoading ? "text-slate-400 cursor-not-allowed" : "text-slate-600 cursor-pointer"}`}
                >
                  Tôi đồng ý với{" "}
                  <span
                    className={`${isLoading ? "text-red-300" : "text-[#dc2626] hover:underline"} font-bold`}
                  >
                    Điều khoản
                  </span>{" "}
                  &{" "}
                  <span
                    className={`${isLoading ? "text-red-300" : "text-[#dc2626] hover:underline"} font-bold`}
                  >
                    Chính sách
                  </span>
                  .
                </label>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white font-bold py-3.5 rounded transition-all text-[15px] uppercase tracking-wide shadow-md flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-red-400 shadow-none cursor-not-allowed"
                    : "bg-[#dc2626] hover:bg-red-700 shadow-red-200"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : isLogin ? (
                  "Đăng Nhập"
                ) : (
                  "Hoàn Thành"
                )}
              </button>
            </div>

            {isLogin && (
              <div className="text-left -mt-2">
                <button
                  type="button"
                  disabled={isLoading}
                  className={`text-sm transition-colors ${isLoading ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-[#dc2626] hover:underline"}`}
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}
          </form>

          <div className="mt-8">
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p
                className={`text-sm ${isLoading ? "text-slate-400" : "text-slate-600"}`}
              >
                {isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}
              </p>
              <button
                onClick={switchMode}
                disabled={isLoading}
                className={`w-full py-3 border-2 font-bold rounded transition-all text-[15px] uppercase ${
                  isLoading
                    ? "border-red-200 text-red-200 cursor-not-allowed bg-transparent"
                    : "border-[#dc2626] text-[#dc2626] hover:bg-red-50 bg-white"
                }`}
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
