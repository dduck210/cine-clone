import React, { useEffect, useState } from "react";
import {
  useLocation,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  CheckCircle,
  Home,
  Ticket,
  ArrowLeft,
  Crown,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [liveTicketStatus, setLiveTicketStatus] = useState(location.state?.ticketStatus || null);

  const isMomoReturn = searchParams.has("resultCode");
  const isHistoryMode = location.state?.isHistoryMode;
  const isCash = location.state?.isCash;
  const bookingStatus = location.state?.bookingStatus;
  const paymentMethod = location.state?.paymentMethod;
  const ticketStatus = location.state?.ticketStatus;

  // Vé chỉ hiển thị QR/PDF sau khi admin xuất vé
  const isTicketIssued = isHistoryMode && liveTicketStatus === "printed";
  const isPendingCash =
    (isCash && !isHistoryMode) ||
    (isHistoryMode && paymentMethod === "cash" && bookingStatus !== "paid");

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isMomoReturn) {
      const resultCode = searchParams.get("resultCode");

      if (resultCode !== "0") {
        setError(
          searchParams.get("message") || "Thanh toán thất bại hoặc bị hủy.",
        );
        return;
      }

      // Gọi backend để verify chữ ký và lấy thông tin vé
      setLoading(true);
      const params = {};
      searchParams.forEach((v, k) => {
        params[k] = v;
      });

      axiosInstance
        .post("/payments/momo/confirm", params)
        .then((res) => setTicketData(res.data))
        .catch((err) =>
          setError(
            err.response?.data?.message || "Xác nhận thanh toán thất bại",
          ),
        )
        .finally(() => setLoading(false));
    } else if (location.state) {
      // Luồng tiền mặt/QR/history — dữ liệu có sẵn trong state
      const s = location.state;
      setTicketData({
        bookingId: s.bookingId,
        bookingCode: s.orderId,
        movieTitle: s.movieTitle,
        cinemaName: s.cinemaName,
        roomName: s.roomName || "",
        showTime: s.showTime,
        showDate: s.showDate,
        selectedSeats: s.selectedSeats,
        finalTotalPrice: s.finalTotalPrice,
        poster: s.poster,
        combos: (s.combos || []).filter((c) => c.quantity > 0),
      });
    } else {
      navigate("/");
    }
  }, []);

  // SSE listener: tự động cập nhật khi admin scan/in vé
  useEffect(() => {
    const bookingId = ticketData?.bookingId || location.state?.bookingId;
    if (!bookingId || liveTicketStatus === "printed") return;

    // Connect directly to backend (Vite proxy buffers SSE, breaking EventSource)
    const streamUrl = `http://${window.location.hostname}:5000/api/bookings/${bookingId}/stream`;
    const es = new EventSource(streamUrl);

    es.addEventListener("ticket_printed", () => {
      setLiveTicketStatus("printed");
      toast.success("Vé của bạn đã được xác nhận!", { duration: 4000 });
    });

    es.onerror = () => {
      // Let EventSource auto-reconnect on network errors
    };

    return () => es.close();
  }, [ticketData, liveTicketStatus]);

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#AE2070] border-t-transparent" />
        <p className="text-slate-500 font-medium">
          Đang xác nhận thanh toán MoMo...
        </p>
      </div>
    );
  }

  // --- Lỗi thanh toán ---
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 pt-28 pb-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200">
            <XCircle className="w-10 h-10 text-red-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase">
            Thanh toán thất bại
          </h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-[#dc2626] text-white font-bold rounded-xl hover:bg-red-700 transition-all"
          >
            Về trang chủ
          </button>
        </main>
      </div>
    );
  }

  if (!ticketData) return null;

  const {
    bookingId,
    bookingCode,
    movieTitle,
    cinemaName,
    roomName,
    showTime,
    showDate,
    selectedSeats,
    finalTotalPrice,
    poster,
    combos = [],
  } = ticketData;

  const showPdfButton = isTicketIssued;

  const handleDownloadPdf = async () => {
    if (!bookingId) return;
    setDownloadingPdf(true);
    try {
      const response = await axiosInstance.get(`/tickets/${bookingId}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${bookingCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải vé PDF. Vui lòng thử lại.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-10">
          {isHistoryMode ? (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">
                {isTicketIssued ? "Chi tiết vé điện tử" : "Chi tiết đơn đặt vé"}
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {bookingCode}
                </span>
              </p>
              {!isTicketIssued && bookingStatus === "paid" && (
                <div className="mt-3 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-full text-sm font-bold">
                  <Clock size={16} /> Vé điện tử đang chờ nhân viên rạp xác nhận
                </div>
              )}
            </>
          ) : isCash ? (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
                <Clock className="w-10 h-10 text-amber-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                Đặt vé thành công!
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {bookingCode || "—"}
                </span>
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-sm font-bold">
                <Clock size={16} /> Vui lòng đến quầy rạp thanh toán trước giờ
                chiếu
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
                <CheckCircle
                  className="w-10 h-10 text-green-600"
                  strokeWidth={2.5}
                />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {bookingCode || "—"}
                </span>
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Vé điện tử sẽ hiển thị sau khi nhân viên rạp xác nhận.
              </p>
            </>
          )}
        </div>

        {/* Ticket card — CGV paper thermal style */}
        <div
          className="mx-auto w-full max-w-[360px] rounded-xl shadow-2xl overflow-hidden font-mono"
          style={{
            border: "1px solid #e5e0d5",
            backgroundColor: "#fdf8f0",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='100'%3E%3Ctext x='0' y='60' font-family='monospace' font-size='14' font-weight='900' letter-spacing='2' fill='%23000' opacity='0.20' transform='rotate(-28 90 50)'%3E5CINE%20TICKET%3C/text%3E%3C/svg%3E")`,
            backgroundSize: "180px 100px",
          }}
        >
          {/* === HEADER: Tiêu đề vé === */}
          <div
            className="px-5 pt-5 pb-4 border-b border-dashed border-gray-300 text-center"
            style={{ background: "transparent" }}
          >
            <p className="text-[13px] font-black tracking-[0.3em] text-gray-700 uppercase">
              THẺ VÀO PHÒNG CHIẾU PHIM
            </p>
          </div>

          {/* === CINEMA INFO === */}
          <div
            className="relative z-10 px-5 py-4 border-b border-dashed border-gray-300 space-y-0.5"
            style={{ background: "transparent" }}
          >
            <p className="font-black text-[14px] text-gray-900 uppercase">
              {cinemaName}
            </p>
            {roomName && (
              <p className="text-[11px] font-bold text-gray-500 uppercase">
                {roomName}
              </p>
            )}
            <p className="text-[10px] text-gray-400 pt-1">
              Mã ĐH: {bookingCode || "—"}
            </p>
            <p className="text-[10px] text-gray-400">
              {showDate} — {showTime}
            </p>
          </div>

          {/* === TORN EDGE DIVIDER === */}
          <div
            className="relative z-10 h-5 flex items-center"
            style={{ background: "transparent" }}
          >
            <div
              className="absolute -left-3 w-6 h-6 rounded-full bg-gray-100 shadow-inner"
              style={{ border: "1px solid #e5e0d5" }}
            />
            <div
              className="absolute -right-3 w-6 h-6 rounded-full bg-gray-100 shadow-inner"
              style={{ border: "1px solid #e5e0d5" }}
            />
            <div className="w-full mx-4 border-t-2 border-dashed border-gray-300" />
          </div>

          {/* === MOVIE + SEAT INFO === */}
          <div
            className="relative z-10 px-5 pt-3 pb-4"
            style={{ background: "transparent" }}
          >
            <p className="text-[18px] font-black text-gray-900 uppercase leading-tight mb-3">
              {movieTitle}
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[11px]">
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">
                  Suất chiếu
                </p>
                <p className="font-black text-gray-800">{showTime}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">
                  Ngày chiếu
                </p>
                <p className="font-black text-gray-800">{showDate}</p>
              </div>
              {roomName && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">
                    Phòng
                  </p>
                  <p className="font-black text-gray-800 uppercase">
                    {roomName}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">
                  Ghế
                </p>
                <p className="font-black text-[#dc2626] text-[16px] leading-none">
                  {Array.isArray(selectedSeats)
                    ? selectedSeats.join(", ")
                    : selectedSeats}
                </p>
              </div>
            </div>

            {combos.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-1.5">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-1">
                  F&B / Combo
                </p>
                {combos.map((c, i) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-gray-600">
                      {c.name}{" "}
                      <span className="text-gray-400">×{c.quantity}</span>
                    </span>
                    <span className="font-black text-gray-800">
                      {(c.price * c.quantity).toLocaleString()}đ
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === QR CODE (CGV/Lotte style — show immediately after paid) === */}
          <div
            className="relative z-10 border-t-2 border-dashed border-gray-300 px-5 py-4 flex flex-col items-center gap-2"
            style={{ background: "transparent" }}
          >
            {isPendingCash ? (
              <div className="flex flex-col items-center gap-2 py-1">
                <Clock className="w-8 h-8 text-amber-400" />
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide text-center">
                  Xuất trình mã này tại quầy để thanh toán
                </p>
                <p className="font-mono text-[11px] text-gray-600 tracking-[0.2em] font-bold">{bookingCode}</p>
              </div>
            ) : bookingCode ? (
              <>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Quét mã để xác thực vé</p>
                <QRCodeSVG
                  value={bookingCode}
                  size={100}
                  bgColor="transparent"
                  fgColor="#111827"
                  level="M"
                />
                <p className="font-mono font-bold text-gray-600 text-[11px] tracking-[0.28em] uppercase">{bookingCode}</p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <Ticket className="w-8 h-8 text-gray-300" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide text-center">Đang tải thông tin vé...</p>
              </div>
            )}
          </div>

          {/* === TOTAL === */}
          <div className="relative z-10 px-5 py-3 flex justify-between items-center bg-gray-900">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {isCash ? "Tổng tiền (chưa TT)" : "Total Paid"}
            </span>
            <span className="font-mono font-black text-white text-[18px]">
              {finalTotalPrice?.toLocaleString()} ₫
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center px-4 flex-wrap">
          {isHistoryMode ? (
            <button
              onClick={() => navigate("/my-tickets")}
              className="w-full sm:w-auto px-10 py-3.5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
            >
              <ArrowLeft size={18} strokeWidth={3} /> Quay lại danh sách
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-10 py-3.5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
              >
                <Home size={18} strokeWidth={3} /> Về trang chủ
              </button>
              <button
                onClick={() => navigate("/my-tickets")}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#dc2626] rounded-2xl font-black text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
              >
                <Ticket size={18} strokeWidth={3} /> Xem vé của tôi
              </button>
            </>
          )}
          {showPdfButton && bookingId && (
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full sm:w-auto px-10 py-3.5 bg-slate-800 rounded-2xl font-black text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest disabled:opacity-60"
            >
              <Download size={18} strokeWidth={3} />
              {downloadingPdf ? "Đang tải..." : "Tải vé PDF"}
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
