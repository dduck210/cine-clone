import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import {
  User,
  Mail,
  CheckCircle,
  MapPin,
  Calendar,
  Armchair,
  Popcorn,
  X,
  Copy,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const QR_BANK = {
  bankId: "MB",
  accountNo: "01234567890",
  accountName: "5CINE CINEMA",
};

const PAYMENT_METHODS = [
  {
    id: "momo",
    label: "Ví MoMo",
    desc: "Thanh toán qua ví điện tử MoMo",
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
        <circle cx="24" cy="24" r="24" fill="#AE2070" />
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="13"
          fontWeight="bold"
          fontFamily="Arial"
        >
          MoMo
        </text>
      </svg>
    ),
    color: "border-[#AE2070] bg-[#AE2070]/5",
    dot: "bg-[#AE2070]",
  },
  {
    id: "qr",
    label: "QR Banking",
    desc: "Quét mã QR chuyển khoản ngân hàng",
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
        <circle cx="24" cy="24" r="24" fill="#0066CC" />
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="bold"
          fontFamily="Arial"
        >
          QR
        </text>
      </svg>
    ),
    color: "border-blue-500 bg-blue-50",
    dot: "bg-blue-500",
  },
];

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    showtimeId,
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
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [qrModal, setQrModal] = useState(null); // { bookingId, bookingCode, qrUrl, amount }

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) navigate("/");
  }, [location, navigate]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (user)
      setCustomerInfo((p) => ({ ...p, name: user.name || "", email: user.email || "" }));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.name.trim()) newErrors.name = "Vui lòng nhập họ tên";
    if (!customerInfo.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!emailRegex.test(customerInfo.email))
      newErrors.email = "Email sai định dạng";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (isProcessing) return;
    if (!validateForm()) {
      toast.error("Vui lòng hoàn thiện thông tin nhận vé!", { id: "pay-val" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé!", { id: "pay-auth" });
      navigate("/login");
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading("Đang xử lý...");

    try {
      // 1. Tạo booking
      const extraItems = combos
        .filter((c) => c.quantity > 0)
        .map((c) => ({ name: c.name, quantity: c.quantity, price: c.price }));
      const bookingRes = await axiosInstance.post("/bookings", {
        showtimeId,
        seats: selectedSeats,
        extraItems,
      });
      const bookingId = bookingRes.data._id;
      const bookingCode = bookingRes.data.bookingCode;

      if (paymentMethod === "momo") {
        const momoRes = await axiosInstance.post("/payments/momo/create", {
          bookingId,
        });
        toast.dismiss(loadingToast);
        localStorage.setItem(
          "pendingBooking",
          JSON.stringify({ bookingId, bookingCode, ...location.state }),
        );
        window.location.href = momoRes.data.payUrl;
      } else if (paymentMethod === "qr") {
        toast.dismiss(loadingToast);
        const addInfo = encodeURIComponent(`5CINE ${bookingCode}`);
        const qrUrl = `https://img.vietqr.io/image/${QR_BANK.bankId}-${QR_BANK.accountNo}-qr_only.png?amount=${finalTotalPrice}&addInfo=${addInfo}&accountName=${encodeURIComponent(QR_BANK.accountName)}`;
        setQrModal({ bookingId, bookingCode, qrUrl, amount: finalTotalPrice });
        setIsProcessing(false);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(
        err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại",
      );
      setIsProcessing(false);
    }
  };

  const handleConfirmQr = async () => {
    if (!qrModal) return;
    setIsProcessing(true);
    const loadingToast = toast.loading("Đang xác nhận...");
    try {
      await axiosInstance.post("/payments", {
        bookingId: qrModal.bookingId,
        method: "qr",
      });
      toast.dismiss(loadingToast);
      setQrModal(null);
      setIsSuccess(true);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            navigate("/payment-success", {
              state: {
                ...location.state,
                orderId: qrModal.bookingCode,
                bookingId: qrModal.bookingId,
                paymentMethod: "qr",
              },
            });
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Xác nhận thất bại, thử lại");
      setIsProcessing(false);
    }
  };

  if (!location.state) return null;

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Navbar />
      <Toaster position="top-center" />

      {isSuccess && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl p-10 max-w-md w-full text-center border border-slate-100">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <CheckCircle
                className="w-12 h-12 text-emerald-500"
                strokeWidth={3}
              />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              Đặt vé thành công!
            </h2>
            <p className="text-slate-500 mb-8 font-medium">
              Đang chuyển đến trang vé ({countdown}s)...
            </p>
          </div>
        </div>
      )}

      {/* QR Payment Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-sm w-full text-center border border-slate-100 relative">
            <button
              onClick={() => setQrModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-black text-slate-800 mb-1">
              Quét mã QR để thanh toán
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Dùng app ngân hàng hoặc ví điện tử để quét
            </p>

            <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
              <img
                src={qrModal.qrUrl}
                alt="VietQR"
                className="w-48 h-48 mx-auto rounded-xl"
                onError={(e) => {
                  e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(`${QR_BANK.bankId} ${QR_BANK.accountNo} ${qrModal.amount} ${qrModal.bookingCode}`)}`;
                }}
              />
            </div>

            <div className="text-left space-y-2 mb-5 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ngân hàng</span>
                <span className="font-bold text-slate-800">
                  {QR_BANK.bankId} Bank
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Số tài khoản</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-800">
                    {QR_BANK.accountNo}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(QR_BANK.accountNo);
                      toast.success("Đã sao chép!");
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Chủ tài khoản</span>
                <span className="font-bold text-slate-800">
                  {QR_BANK.accountName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Số tiền</span>
                <span className="font-black text-blue-600">
                  {qrModal.amount.toLocaleString()}đ
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nội dung CK</span>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-800">
                    5CINE {qrModal.bookingCode}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `5CINE ${qrModal.bookingCode}`,
                      );
                      toast.success("Đã sao chép!");
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmQr}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {isProcessing ? "Đang xác nhận..." : "Tôi đã chuyển khoản xong"}
            </button>
            <p className="text-xs text-slate-400 mt-3">
              Nhấn xác nhận sau khi chuyển khoản thành công
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
            Kiểm tra thông tin và xác nhận đặt vé của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Thông tin nhận vé */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626] shadow-sm">
                  <User size={22} strokeWidth={2.5} />
                </div>
                Thông tin nhận vé
              </h3>
              <div className="space-y-5">
                <div className="relative">
                  <User
                    className={`absolute left-4 top-4 ${errors.name ? "text-red-500" : "text-slate-400"}`}
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Họ và tên khách hàng"
                    value={customerInfo.name}
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
                    <p className="text-red-500 text-xs mt-1.5 font-bold ml-1">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-4 ${errors.email ? "text-red-500" : "text-slate-400"}`}
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="Email nhận vé"
                    value={customerInfo.email}
                    className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-4 outline-none transition-all font-semibold ${errors.email ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                    onChange={(e) => {
                      setCustomerInfo({ ...customerInfo, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 font-bold ml-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Phương thức thanh toán */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626] shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                Phương thức thanh toán
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${paymentMethod === m.id ? m.color + " shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                  >
                    <div className="shrink-0">{m.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">
                        {m.label}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">{m.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMethod === m.id ? "border-transparent " + m.dot : "border-slate-300"}`}
                    >
                      {paymentMethod === m.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Cột phải: tóm tắt đơn */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
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

              <div className="p-8 bg-white">
                <div className="space-y-5 mb-8">
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
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
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
                  {combos?.some((c) => c.quantity > 0) && (
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

                <div className="pt-6 border-t-2 border-slate-100 flex justify-between items-end mb-8">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                    Tổng cộng
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {finalTotalPrice?.toLocaleString("vi-VN")}{" "}
                    <span className="text-lg text-slate-300 font-normal">
                      ₫
                    </span>
                  </span>
                </div>

                {/* Nút thanh toán */}
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 ${
                    isProcessing
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : paymentMethod === "momo"
                        ? "bg-[#AE2070] hover:bg-[#8f1a5c] text-white shadow-pink-200 transform hover:-translate-y-1"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 transform hover:-translate-y-1"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      ĐANG XỬ LÝ...
                    </>
                  ) : paymentMethod === "momo" ? (
                    "THANH TOÁN QUA MOMO"
                  ) : (
                    "HIỂN THỊ MÃ QR"
                  )}
                </button>

                <p className="text-center text-slate-400 text-xs mt-3 font-medium">
                  {paymentMethod === "momo"
                    ? "Bạn sẽ được chuyển đến trang thanh toán MoMo"
                    : "Mã QR VietQR hỗ trợ tất cả ngân hàng Việt Nam"}
                </p>
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
