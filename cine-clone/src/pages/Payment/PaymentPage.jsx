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
  Copy,
  Info,
  ShieldCheck,
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

  const PAYMENT_DATA = {
    momo: {
      name: "Ví MoMo",
      accountName: "DUONG ANH DUC",
      accountNo: "0964717591",
      qrImage: "src/assets/momo.png",
      color: "#d82d8b",
      bgColor: "bg-[#fff0f6]",
    },
    zalopay: {
      name: "Ví ZaloPay",
      accountName: "DUONG ANH DUC",
      accountNo: "0964717591",
      qrImage: "src/assets/zalopay.png",
      color: "#0068ff",
      bgColor: "bg-[#e5f0ff]",
    },
    card: {
      name: "MB Bank (Napas)",
      accountName: "DUONG ANH DUC",
      accountNo: "0964717591",
      qrImage: "src/assets/mbbank.png",
      color: "#1e293b",
      bgColor: "bg-slate-50",
    },
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) navigate("/");
  }, [location, navigate]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!", { id: "copy" });
  };

  const validateForm = () => {
    let newErrors = {};
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.name.trim()) newErrors.name = "Vui lòng nhập họ tên";
    if (!customerInfo.phone.trim())
      newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!phoneRegex.test(customerInfo.phone))
      newErrors.phone = "SĐT không hợp lệ";
    if (!customerInfo.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!emailRegex.test(customerInfo.email))
      newErrors.email = "Email sai định dạng";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = () => {
    if (isProcessing) return;
    if (!validateForm()) {
      toast.error("Vui lòng hoàn thiện thông tin nhận vé!", { id: "pay-val" });
      return;
    }
    setIsProcessing(true);
    const loadingToast = toast.loading("Đang xác thực giao dịch...");

    setTimeout(() => {
      toast.dismiss(loadingToast);
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
    }, 1500);
  };

  if (!location.state) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Navbar />
      <Toaster position="top-center" />

      {isSuccess && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-2xl p-10 max-w-md w-full text-center border border-slate-100 animate-scale-up">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner">
              <CheckCircle
                className="w-12 h-12 text-emerald-500 animate-bounce-short"
                strokeWidth={3}
              />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 leading-tight">
              Thanh toán hoàn tất!
            </h2>
            <p className="text-slate-500 mb-8 font-medium">
              Hệ thống đang phê duyệt vé của bạn ({countdown}s)...
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
            Vui lòng quét mã bên dưới để hoàn tất đơn hàng.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8">
            <section className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626] shadow-sm">
                  <User size={22} strokeWidth={2.5} />
                </div>
                Thông tin nhận vé
              </h3>
              <div className="space-y-6">
                <div className="relative">
                  <User
                    className={`absolute left-4 top-4 ${errors.name ? "text-red-500" : "text-slate-400"}`}
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Họ và tên khách hàng"
                    className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-4 outline-none transition-all font-semibold ${errors.name ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                    onChange={(e) => {
                      setCustomerInfo({
                        ...customerInfo,
                        name: e.target.value,
                      });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-[11px] mt-2 font-bold ml-1">
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
                      className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-4 outline-none transition-all font-semibold ${errors.phone ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
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
                      className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-4 outline-none transition-all font-semibold ${errors.email ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
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
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626] shadow-sm">
                  <CreditCard size={22} strokeWidth={2.5} />
                </div>
                Phương thức thanh toán
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {Object.keys(PAYMENT_DATA).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center gap-3 p-4 border-2 rounded-2xl transition-all duration-300 ${paymentMethod === method ? "border-[#dc2626] bg-red-50/30 shadow-md scale-105" : "border-slate-100 hover:border-slate-300"}`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === method ? "bg-[#dc2626] text-white shadow-lg" : "bg-slate-100 text-slate-400"}`}
                    >
                      {method === "card" ? (
                        <CreditCard size={24} />
                      ) : (
                        <QrCode size={24} />
                      )}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {PAYMENT_DATA[method].name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="bg-slate-900 rounded-[28px] p-8 text-white overflow-hidden relative group">
                <div className="flex flex-col md:flex-row gap-10 items-center relative z-10">
                  <div className="bg-white p-3 rounded-[24px] shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    <img
                      src={
                        paymentMethod === "momo"
                          ? "src/assets/momo.png"
                          : paymentMethod === "zalopay"
                            ? "src/assets/zalopay.png"
                            : "src/assets/mbbank.png "
                      }
                      alt="Bank QR"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-5 w-full">
                    <div className="flex items-center gap-2 text-[#dc2626] font-black text-xs uppercase tracking-widest">
                      <ShieldCheck size={16} />{" "}
                      <span>Cổng thanh toán an toàn 5Cine</span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1.5">
                        Chủ tài khoản
                      </p>
                      <p className="font-black text-xl tracking-tight uppercase">
                        {PAYMENT_DATA[paymentMethod].accountName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1.5">
                        Số tài khoản / SĐT
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-2xl font-black tracking-widest text-[#dc2626]">
                          {PAYMENT_DATA[paymentMethod].accountNo}
                        </p>
                        <button
                          onClick={() =>
                            handleCopy(PAYMENT_DATA[paymentMethod].accountNo)
                          }
                          className="p-2 bg-white/10 rounded-xl hover:bg-[#dc2626] transition-all"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-0.5">
                          Số tiền
                        </p>
                        <p className="text-2xl font-black">
                          {finalTotalPrice?.toLocaleString()} ₫
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-0.5">
                          Nội dung
                        </p>
                        <p className="font-bold text-sm text-yellow-400">
                          5CINE VE {Math.floor(1000 + Math.random() * 9000)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#dc2626]/10 blur-[100px] rounded-full"></div>
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
                <div className="relative z-10 w-full flex gap-5 items-center text-white">
                  {poster && (
                    <img
                      src={poster}
                      className="w-20 h-28 object-cover rounded-xl shadow-2xl border border-white/20 shrink-0"
                      alt="poster"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-black text-xl mb-2 leading-tight uppercase tracking-tight line-clamp-2">
                      {movieTitle}
                    </h3>
                    <div className="bg-[#dc2626] px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-block">
                      2D Phụ Đề
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 relative bg-white">
                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] shrink-0 border border-red-100">
                      <MapPin size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                        Rạp chiếu
                      </p>
                      <p className="font-bold text-slate-800 text-[16px] leading-tight">
                        {cinemaName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] shrink-0 border border-red-100">
                      <Calendar size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
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
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#dc2626] shrink-0 shadow-sm">
                        <Popcorn size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#dc2626] text-[10px] font-black uppercase tracking-wider mb-2">
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

                <div className="pt-6 border-t-2 border-slate-100 flex justify-between items-end">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-1">
                    Tổng cộng
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {finalTotalPrice?.toLocaleString("vi-VN")}{" "}
                    <span className="text-lg text-slate-300 font-normal">
                      ₫
                    </span>
                  </span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full font-black py-4.5 rounded-2xl shadow-xl transition-all text-sm uppercase tracking-widest mt-10 flex items-center justify-center gap-3 
                  ${isProcessing ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-[#dc2626] hover:bg-red-700 text-white shadow-red-200 transform hover:-translate-y-1"}`}
                >
                  {isProcessing
                    ? "ĐANG XÁC NHẬN..."
                    : "XÁC NHẬN ĐÃ CHUYỂN KHOẢN"}
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
