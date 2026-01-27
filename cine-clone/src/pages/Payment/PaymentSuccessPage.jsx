import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  CheckCircle,
  MapPin,
  Calendar,
  Clock,
  Home,
  Ticket,
  ArrowLeft,
  Printer,
} from "lucide-react";

const PaymentSuccessPage = () => {
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
    orderId,
    isHistoryMode,
  } = location.state || {};

  if (!location.state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">
          Không tìm thấy đơn hàng!
        </h2>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          {isHistoryMode ? (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Chi tiết vé điện tử
              </h1>
              <p className="text-gray-500">
                Mã đơn hàng:{" "}
                <span className="font-mono font-bold text-gray-900">
                  {orderId}
                </span>
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-short">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-500">
                Mã đơn hàng:{" "}
                <span className="font-mono font-bold text-gray-900">
                  {orderId || "XC-99281"}
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Vé đã được gửi tới email của bạn.
              </p>
            </>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative print:shadow-none print:border-none">
          <div className="bg-[#0369a1] p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  {movieTitle}
                </h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                  2D Phụ Đề
                </span>
              </div>
              {poster && (
                <img
                  src={poster}
                  alt="poster"
                  className="w-20 h-28 object-cover rounded-lg shadow-md border-2 border-white/20 hidden sm:block"
                />
              )}
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">
                    Rạp chiếu
                  </p>
                  <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <MapPin size={18} className="text-[#0369a1]" /> {cinemaName}
                  </p>
                  <p className="text-gray-500 text-sm ml-6">{showAddress}</p>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">
                      Ngày chiếu
                    </p>
                    <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Calendar size={18} className="text-[#0369a1]" />{" "}
                      {showDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">
                      Giờ chiếu
                    </p>
                    <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Clock size={18} className="text-[#0369a1]" /> {showTime}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">
                    Ghế ngồi
                  </p>
                  <p className="font-extrabold text-[#0369a1] text-2xl tracking-widest">
                    {Array.isArray(selectedSeats)
                      ? selectedSeats.join(", ")
                      : selectedSeats}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-4 border border-gray-100 border-dashed">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${orderId || "XC-DEMO"}`}
                  alt="QR Code"
                  className="w-40 h-40 mix-blend-multiply"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Đưa mã này cho nhân viên soát vé
                </p>
                <p className="font-mono font-bold text-gray-800 text-lg mt-1 tracking-widest">
                  {orderId}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-4">
                Chi tiết giao dịch
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Giá vé ({selectedSeats.length}x)</span>
                  <span>
                    {((selectedSeats.length || 0) * 120000).toLocaleString()} đ
                  </span>
                </div>
                {combos &&
                  combos
                    .filter((c) => c.quantity > 0)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="flex justify-between text-gray-600"
                      >
                        <span>
                          {c.name} ({c.quantity}x)
                        </span>
                        <span>{(c.price * c.quantity).toLocaleString()} đ</span>
                      </div>
                    ))}
                <div className="flex justify-between text-gray-900 font-bold text-lg pt-2 border-t border-dashed border-gray-200 mt-2">
                  <span>Tổng thanh toán</span>
                  <span className="text-[#0369a1]">
                    {finalTotalPrice?.toLocaleString()} đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute left-0 bottom-24 w-4 h-8 bg-gray-50 rounded-r-full"></div>
          <div className="absolute right-0 bottom-24 w-4 h-8 bg-gray-50 rounded-l-full"></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center print:hidden">
          {isHistoryMode ? (
            <>
              <button
                onClick={() => navigate("/my-tickets")}
                className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} /> Quay lại danh sách
              </button>
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-8 py-3 bg-[#0369a1] rounded-xl font-bold text-white hover:bg-[#0284c7] shadow-lg flex items-center justify-center gap-2"
              >
                <Printer size={18} /> In vé
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Home size={18} /> Về trang chủ
                </button>
              </Link>
              <Link to="/my-tickets" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto px-8 py-3 bg-[#0369a1] rounded-xl font-bold text-white hover:bg-[#0284c7] shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                  <Ticket size={18} /> Xem vé của tôi
                </button>
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
