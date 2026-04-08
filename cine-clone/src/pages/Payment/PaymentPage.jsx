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

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    movieTitle,
    cinemaName,
    showTime,
    showDate,
    showAddress,
    selectedSeats,
    combos,
    finalTotalPrice,
    poster,
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) navigate("/");
  }, [location, navigate]);

  const handlePayment = () => {
    setIsSuccess(true);
    const fakeOrderId = `XC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      orderId: fakeOrderId,
      customerName: customerInfo.name || "Khách hàng Vãng lai",
      phone: customerInfo.phone || "Không cung cấp",
      bookingTime: new Date().toLocaleString("vi-VN"),
      movieTitle,
      cinemaName,
      showDate,
      showTime,
      selectedSeats,
      finalTotalPrice,
      status: "Đã thanh toán",
    };

    const existingOrders = JSON.parse(
      localStorage.getItem("admin_orders") || "[]",
    );
    localStorage.setItem(
      "admin_orders",
      JSON.stringify([newOrder, ...existingOrders]),
    );

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          navigate("/payment-success", {
            state: {
              movieTitle,
              cinemaName,
              showTime,
              showDate,
              showAddress,
              selectedSeats,
              combos,
              finalTotalPrice,
              poster,
              orderId: fakeOrderId,
            },
          });
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!location.state) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900 relative">
      <Navbar />

      {isSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden animate-scale-up">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle
                className="w-12 h-12 text-green-500 animate-bounce-short"
                fill="currentColor"
              />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Thanh toán thành công!
            </h2>
            <p className="text-gray-500 mb-8">
              Vé đã được gửi tới email và số điện thoại của bạn. Chúc bạn xem
              phim vui vẻ!
            </p>
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-5 mb-8">
              <p className="text-sm text-gray-500 mb-1 uppercase tracking-wider">
                Mã đặt vé
              </p>
              <p className="text-2xl font-mono font-black text-[#0369a1] tracking-widest">
                XC-{Math.floor(100000 + Math.random() * 900000)}
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-[#0369a1] hover:bg-[#0284c7] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200"
            >
              Về trang chủ ({countdown}s)
            </button>
          </div>
        </div>
      )}

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Xác nhận & Thanh toán
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Vui lòng kiểm tra lại thông tin đặt vé và chọn phương thức thanh
            toán phù hợp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50">
              <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0369a1]">
                  <User size={22} fill="currentColor" />
                </div>
                Thông tin người nhận
              </h3>
              <div className="space-y-5">
                <div className="relative">
                  <User
                    className="absolute left-4 top-3.5 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Họ và tên (Bắt buộc)"
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-3.5 text-gray-400"
                      size={20}
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại (Bắt buộc)"
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-3.5 text-gray-400"
                      size={20}
                    />
                    <input
                      type="email"
                      placeholder="Email (Nhận vé)"
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50">
              <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0369a1]">
                  <CreditCard size={22} fill="currentColor" />
                </div>
                Phương thức thanh toán
              </h3>
              <div className="space-y-4">
                <label
                  onClick={() => setPaymentMethod("momo")}
                  className={`relative flex items-center gap-5 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm overflow-hidden group ${paymentMethod === "momo" ? "border-[#d82d8b] bg-[#fff0f6]" : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-md"}`}
                >
                  <Smartphone
                    className={`absolute -right-6 -bottom-6 w-24 h-24 transition-all opacity-10 group-hover:opacity-20 rotate-12 ${paymentMethod === "momo" ? "text-[#d82d8b]" : "text-gray-400"}`}
                  />
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${paymentMethod === "momo" ? "bg-[#d82d8b] text-white shadow-lg shadow-pink-200 scale-110" : "bg-gray-100 text-gray-400"}`}
                  >
                    <QrCode size={28} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <h4
                      className={`font-bold text-lg ${paymentMethod === "momo" ? "text-[#d82d8b]" : "text-gray-800"}`}
                    >
                      Ví điện tử MoMo
                    </h4>
                    <p
                      className={`text-sm ${paymentMethod === "momo" ? "text-pink-700" : "text-gray-500"}`}
                    >
                      Quét mã QR để thanh toán nhanh chóng
                    </p>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${paymentMethod === "momo" ? "border-[#d82d8b] bg-[#d82d8b] text-white" : "border-gray-300"}`}
                  >
                    {paymentMethod === "momo" && (
                      <CheckCircle size={16} fill="currentColor" />
                    )}
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("zalopay")}
                  className={`relative flex items-center gap-5 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm overflow-hidden group ${paymentMethod === "zalopay" ? "border-[#0068ff] bg-[#e5f0ff]" : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-md"}`}
                >
                  <Smartphone
                    className={`absolute -right-6 -bottom-6 w-24 h-24 transition-all opacity-10 group-hover:opacity-20 rotate-12 ${paymentMethod === "zalopay" ? "text-[#0068ff]" : "text-gray-400"}`}
                  />
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${paymentMethod === "zalopay" ? "bg-[#0068ff] text-white shadow-lg shadow-blue-200 scale-110" : "bg-gray-100 text-gray-400"}`}
                  >
                    <span className="font-bold text-xs">ZaloPay</span>
                  </div>
                  <div className="flex-1 relative z-10">
                    <h4
                      className={`font-bold text-lg ${paymentMethod === "zalopay" ? "text-[#0068ff]" : "text-gray-800"}`}
                    >
                      Ví ZaloPay
                    </h4>
                    <p
                      className={`text-sm ${paymentMethod === "zalopay" ? "text-blue-700" : "text-gray-500"}`}
                    >
                      Thanh toán qua ứng dụng Zalo
                    </p>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${paymentMethod === "zalopay" ? "border-[#0068ff] bg-[#0068ff] text-white" : "border-gray-300"}`}
                  >
                    {paymentMethod === "zalopay" && (
                      <CheckCircle size={16} fill="currentColor" />
                    )}
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("card")}
                  className={`relative flex items-center gap-5 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm overflow-hidden group ${paymentMethod === "card" ? "border-gray-800 bg-gray-50" : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-md"}`}
                >
                  <CreditCard
                    className={`absolute -right-6 -bottom-6 w-24 h-24 transition-all opacity-10 group-hover:opacity-20 rotate-12 ${paymentMethod === "card" ? "text-gray-800" : "text-gray-400"}`}
                  />
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${paymentMethod === "card" ? "bg-gray-800 text-white shadow-lg scale-110" : "bg-gray-100 text-gray-400"}`}
                  >
                    <CreditCard size={28} />
                  </div>
                  <div className="flex-1 relative z-10">
                    <h4
                      className={`font-bold text-lg ${paymentMethod === "card" ? "text-gray-900" : "text-gray-800"}`}
                    >
                      Thẻ Quốc tế / Nội địa
                    </h4>
                    <p
                      className={`text-sm ${paymentMethod === "card" ? "text-gray-700" : "text-gray-500"}`}
                    >
                      Visa, Master, JCB, Napas
                    </p>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${paymentMethod === "card" ? "border-gray-800 bg-gray-800 text-white" : "border-gray-300"}`}
                  >
                    {paymentMethod === "card" && (
                      <CheckCircle size={16} fill="currentColor" />
                    )}
                  </div>
                </label>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] overflow-hidden border border-gray-100">
              <div className="relative h-48 bg-gray-900 flex items-end p-6 overflow-hidden">
                {poster && (
                  <>
                    <img
                      src={poster}
                      className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm scale-110"
                      alt="bg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
                  </>
                )}
                <div className="relative z-10 w-full flex gap-4 items-end">
                  {poster && (
                    <img
                      src={poster}
                      className="w-24 h-36 object-cover rounded-lg shadow-lg border-2 border-white/20"
                      alt="poster"
                    />
                  )}
                  <div className="flex-1 pb-2">
                    <h3 className="font-extrabold text-2xl text-white mb-2 leading-tight text-shadow-sm">
                      {movieTitle}
                    </h3>
                    <p className="text-white/80 text-sm font-medium bg-white/10 inline-block px-3 py-1 rounded-full backdrop-blur-md">
                      2D Phụ Đề
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 relative bg-white">
                <div className="absolute -left-3 top-0 w-6 h-6 bg-[#f8fafc] rounded-full"></div>
                <div className="absolute -right-3 top-0 w-6 h-6 bg-[#f8fafc] rounded-full"></div>
                <div className="border-t-2 border-dashed border-gray-200 mb-8"></div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0369a1] shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Rạp chiếu</p>
                      <p className="font-bold text-gray-900 text-lg leading-tight">
                        {cinemaName}
                      </p>
                      <p className="text-gray-500 text-sm mt-0.5">
                        {showAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Suất chiếu</p>
                      <p className="font-bold text-gray-900 text-lg leading-tight">
                        {showTime} - {showDate}
                      </p>
                      <p className="text-gray-500 text-sm mt-0.5">Phòng 03</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0369a1] shrink-0 shadow-sm">
                      <Armchair size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-500 text-sm mb-1">
                        Ghế đã chọn ({selectedSeats?.length})
                      </p>
                      <p className="font-extrabold text-[#0369a1] text-xl break-words tracking-wider">
                        {selectedSeats?.join(", ")}
                      </p>
                    </div>
                  </div>
                  {combos && combos.some((c) => c.quantity > 0) && (
                    <div className="flex items-start gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-500 shrink-0 shadow-sm">
                        <Popcorn size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-orange-700 text-sm font-bold mb-2">
                          Combo bắp nước:
                        </p>
                        <ul className="space-y-2">
                          {combos
                            .filter((c) => c.quantity > 0)
                            .map((c) => (
                              <li
                                key={c.id}
                                className="flex justify-between text-sm text-gray-700 font-medium"
                              >
                                <span>
                                  Let's {c.quantity}x {c.name}
                                </span>
                                <span>
                                  {(c.price * c.quantity).toLocaleString()}đ
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t-2 border-gray-100">
                  <div className="flex justify-between items-end">
                    <span className="text-gray-600 font-bold text-lg">
                      Tổng thanh toán
                    </span>
                    <span className="text-3xl font-extrabold text-[#0369a1]">
                      {finalTotalPrice?.toLocaleString("vi-VN")}{" "}
                      <span className="text-lg">đ</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={handlePayment}
                  className="w-full bg-gradient-to-r from-[#0369a1] to-[#0284c7] hover:from-[#0284c7] hover:to-[#0369a1] text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-200/50 transition-all text-lg uppercase tracking-wider mt-8 transform hover:-translate-y-1"
                >
                  Xác nhận thanh toán
                </button>
                <p className="text-xs text-center text-gray-400 mt-4">
                  Bằng việc xác nhận, bạn đồng ý với điều khoản sử dụng.
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
