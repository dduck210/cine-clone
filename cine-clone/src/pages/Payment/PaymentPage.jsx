import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  CreditCard,
  User,
  Mail,
  Phone,
  CheckCircle,
  Smartphone,
  QrCode,
  MapPin,
  Calendar,
  Armchair,
  Popcorn,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    movieTitle,
    cinemaName,
    showTime,
    showDate,
    showAddress,
    selectedSeats = [],
    combos = [],
    finalTotalPrice,
    poster,
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) navigate("/");
  }, [location, navigate]);

  const validateForm = () => {
    let newErrors = {};
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!customerInfo.name.trim()) newErrors.name = "Vui lòng nhập họ tên";
    if (!customerInfo.phone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!phoneRegex.test(customerInfo.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }
    if (!customerInfo.email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!emailRegex.test(customerInfo.email)) {
      newErrors.email = "Email sai định dạng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = () => {
    if (isProcessing) return;
    if (!validateForm()) {
      toast.error("Thông tin chưa chính xác!", { id: "pay-val" });
      return;
    }

    setIsProcessing(true);
    setIsSuccess(true);

    const fakeOrderId = `XC-${Math.floor(100000 + Math.random() * 900000)}`;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          navigate("/payment-success", {
            state: { ...location.state, orderId: fakeOrderId },
          });
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!location.state) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Navbar />
      <Toaster position="top-center" />

      {isSuccess && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl p-10 max-w-md w-full text-center border border-slate-100">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner">
              <CheckCircle
                className="w-12 h-12 text-emerald-500 animate-bounce-short"
                strokeWidth={3}
              />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              Thanh toán xong!
            </h2>
            <p className="text-slate-500 mb-8 font-medium">
              Đang chuyển hướng sau {countdown}s...
            </p>
          </div>
        </div>
      )}

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black text-slate-800 mb-3 uppercase tracking-tight">
            Xác nhận & Thanh toán
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            An toàn - Nhanh chóng - Bảo mật
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <section className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626]">
                  <User size={22} strokeWidth={2.5} />
                </div>
                Thông tin người nhận
              </h3>
              <div className="space-y-6">
                <div className="relative">
                  <User
                    className={`absolute left-4 top-4 ${errors.name ? "text-red-500" : "text-slate-400"}`}
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Họ và tên (Bắt buộc)"
                    className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all font-semibold ${errors.name ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                    onChange={(e) => {
                      setCustomerInfo({
                        ...customerInfo,
                        name: e.target.value,
                      });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-[11px] mt-2 font-bold italic ml-1">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="relative">
                    <Phone
                      className={`absolute left-4 top-4 ${errors.phone ? "text-red-500" : "text-slate-400"}`}
                      size={20}
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại"
                      className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all font-semibold ${errors.phone ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                      onChange={(e) => {
                        setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value,
                        });
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                    />
                  </div>
                  <div className="relative">
                    <Mail
                      className={`absolute left-4 top-4 ${errors.email ? "text-red-500" : "text-slate-400"}`}
                      size={20}
                    />
                    <input
                      type="email"
                      placeholder="Email nhận vé"
                      className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-3.5 outline-none transition-all font-semibold ${errors.email ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                      onChange={(e) => {
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        });
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                    />
                  </div>
                </div>
                {(errors.phone || errors.email) && (
                  <p className="text-red-500 text-[11px] font-bold italic ml-1">
                    {errors.phone || errors.email}
                  </p>
                )}
              </div>
            </section>

            <section className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626]">
                  <CreditCard size={22} strokeWidth={2.5} />
                </div>
                Phương thức thanh toán
              </h3>
              <div className="space-y-4">
                {["momo", "zalopay", "card"].map((method) => (
                  <label
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`relative flex items-center gap-6 p-6 border-2 rounded-[24px] cursor-pointer transition-all duration-300 shadow-sm overflow-hidden group 
        ${
          paymentMethod === method
            ? method === "momo"
              ? "border-[#d82d8b] bg-[#fff0f6]"
              : method === "zalopay"
                ? "border-[#0068ff] bg-[#e5f0ff]"
                : "border-slate-800 bg-slate-50"
            : "border-slate-100 bg-white hover:border-slate-300"
        }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 
            ${
              paymentMethod === method
                ? method === "momo"
                  ? "bg-[#d82d8b] text-white shadow-lg shadow-pink-200"
                  : method === "zalopay"
                    ? "bg-[#0068ff] text-white shadow-lg shadow-blue-200"
                    : "bg-slate-800 text-white shadow-lg"
                : "bg-slate-100 text-slate-400"
            }`}
                    >
                      {method === "card" ? (
                        <CreditCard size={28} />
                      ) : (
                        <QrCode size={28} />
                      )}
                    </div>

                    <div className="flex-1 relative z-10">
                      <h4
                        className={`font-black text-lg ${
                          paymentMethod === method
                            ? method === "momo"
                              ? "text-[#d82d8b]"
                              : method === "zalopay"
                                ? "text-[#0068ff]"
                                : "text-slate-900"
                            : "text-slate-800"
                        }`}
                      >
                        {method === "card"
                          ? "Thẻ Quốc tế / Nội địa"
                          : method === "momo"
                            ? "Ví điện tử MoMo"
                            : "Ví ZaloPay"}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Thanh toán bảo mật 100%
                      </p>
                    </div>

                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 
          ${
            paymentMethod === method
              ? method === "momo"
                ? "border-[#d82d8b] bg-[#d82d8b] text-white"
                : method === "zalopay"
                  ? "border-[#0068ff] bg-[#0068ff] text-white"
                  : "border-slate-800 bg-slate-800 text-white"
              : "border-slate-200 bg-transparent"
          }`}
                    >
                      {paymentMethod === method && (
                        <CheckCircle
                          size={18}
                          strokeWidth={3}
                          className="animate-scale-in"
                        />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 sticky top-28">
            <div className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-slate-200">
              <div className="relative h-48 bg-slate-900 flex items-center p-6 overflow-hidden">
                {poster && (
                  <img
                    src={poster}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110"
                    alt="bg"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                <div className="relative z-10 w-full flex gap-5 items-center">
                  {poster && (
                    <img
                      src={poster}
                      className="w-20 h-28 object-cover rounded-xl shadow-2xl border border-white/20 shrink-0"
                      alt="poster"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-black text-xl text-white mb-2 leading-tight uppercase tracking-tight line-clamp-2">
                      {movieTitle}
                    </h3>
                    <div className="bg-[#dc2626] text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest inline-block shadow-md">
                      2D Phụ Đề
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 relative bg-white">
                <div className="absolute -left-3 top-0 w-6 h-6 bg-slate-50 rounded-full border-r border-slate-200 shadow-inner"></div>
                <div className="absolute -right-3 top-0 w-6 h-6 bg-slate-50 rounded-full border-l border-slate-200 shadow-inner"></div>
                <div className="border-t-2 border-dashed border-slate-100 mb-8"></div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] shrink-0 border border-red-100 shadow-sm">
                      <MapPin size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                        Rạp chiếu
                      </p>
                      <p className="font-bold text-slate-800 text-[16px] leading-tight">
                        {cinemaName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] shrink-0 border border-red-100 shadow-sm">
                      <Calendar size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                        Suất chiếu
                      </p>
                      <p className="font-bold text-slate-800 text-[16px] leading-tight">
                        {showTime} - {showDate}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-inner">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#dc2626] shrink-0 shadow-sm border border-slate-100">
                      <Armchair size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                        Vị trí ghế
                      </p>
                      <p className="font-black text-[#dc2626] text-xl tracking-widest">
                        {selectedSeats?.join(", ")}
                      </p>
                    </div>
                  </div>

                  {combos && combos.some((c) => c.quantity > 0) && (
                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shrink-0 shadow-sm">
                        <Popcorn size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-red-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                          Bắp & Nước
                        </p>
                        <ul className="space-y-1.5">
                          {combos
                            .filter((c) => c.quantity > 0)
                            .map((c) => (
                              <li
                                key={c.id}
                                className="flex justify-between text-[13px] text-slate-700 font-bold"
                              >
                                <span>
                                  {c.quantity}x {c.name}
                                </span>
                                <span className="text-slate-400">
                                  {(c.price * c.quantity).toLocaleString()}đ
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t-2 border-slate-100 flex justify-between items-end">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">
                    Tổng tiền thanh toán
                  </span>
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {finalTotalPrice?.toLocaleString("vi-VN")}{" "}
                    <span className="text-base text-slate-300 font-normal">
                      đ
                    </span>
                  </span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all text-sm uppercase tracking-widest mt-8 flex items-center justify-center gap-3 
                  ${isProcessing ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-[#dc2626] hover:bg-red-700 text-white shadow-red-200 transform hover:-translate-y-1"}`}
                >
                  {isProcessing ? "ĐANG XỬ LÝ..." : "XÁC NHẬN THANH TOÁN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default PaymentPage;
