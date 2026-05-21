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
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import { EventSourcePolyfill } from "event-source-polyfill";
import toast, { Toaster } from "react-hot-toast";
import { usePushSubscription } from "../../hooks/usePushSubscription";

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

  const isTicketIssued = liveTicketStatus === "printed";
  const isPendingCash =
    (isCash && !isHistoryMode) ||
    (isHistoryMode && paymentMethod === "cash" && bookingStatus !== "paid");

  usePushSubscription(isTicketIssued ? null : ticketData?.bookingCode);

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

      setLoading(true);
      const params = {};
      searchParams.forEach((v, k) => { params[k] = v; });

      axiosInstance
        .post("/payments/momo/confirm", params)
        .then((res) => setTicketData(res.data))
        .catch((err) =>
          setError(err.response?.data?.message || "Xác nhận thanh toán thất bại"),
        )
        .finally(() => setLoading(false));
    } else if (location.state) {
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

  // SSE: auto-update khi admin scan/in vé
  useEffect(() => {
    const bookingId = ticketData?.bookingId || location.state?.bookingId;
    if (!bookingId || liveTicketStatus === "printed") return;

    const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
    const streamUrl = `${apiBase}/bookings/${bookingId}/stream`;

    let es;
    if (import.meta.env.VITE_API_URL) {
      es = new EventSourcePolyfill(streamUrl, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
    } else {
      es = new EventSource(streamUrl);
    }

    es.addEventListener("ticket_printed", () => {
      setLiveTicketStatus("printed");
      toast.success("Vé của bạn đã được xác nhận!", { duration: 4000 });
    });

    es.onerror = (err) => {
      console.error("[SSE] connection error:", err, "url:", streamUrl);
    };

    return () => es.close();
  }, [ticketData, liveTicketStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#AE2070] border-t-transparent" />
        <p className="text-slate-500 font-medium">Đang xác nhận thanh toán MoMo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 pt-28 pb-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200">
            <XCircle className="w-10 h-10 text-red-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase">Thanh toán thất bại</h1>
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
    combos = [],
  } = ticketData;

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
        {/* Page title */}
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
              {bookingStatus === "paid" && (
                isTicketIssued ? (
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold">
                    <CheckCircle size={16} /> Vé đã xác nhận
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-full text-sm font-bold">
                    <Clock size={16} /> Vé điện tử đang chờ nhân viên rạp xác nhận
                  </div>
                )
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
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
                <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={2.5} />
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
            </>
          )}
        </div>

        {/* Main card: QR (chưa xác nhận) hoặc Vé hợp lệ (đã xác nhận) */}
        {isTicketIssued ? (
          <div className="mx-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-emerald-500 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-white font-black text-xl">Vé hợp lệ</h2>
              <p className="text-white/80 text-sm mt-1">Chúc bạn xem phim vui vẻ!</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Mã vé</span>
                <span className="font-mono font-bold text-[#dc2626] text-sm">{bookingCode}</span>
              </div>
              <hr className="border-dashed border-gray-200" />
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Phim</span>
                <span className="font-bold text-gray-900 text-sm text-right max-w-[60%]">{movieTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Rạp</span>
                <span className="text-gray-700 text-sm">{cinemaName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Suất chiếu</span>
                <span className="text-gray-700 text-sm">{showDate} — {showTime}</span>
              </div>
              {roomName && (
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Phòng</span>
                  <span className="text-gray-700 text-sm">{roomName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Ghế</span>
                <span className="font-bold text-[#dc2626] text-sm">
                  {Array.isArray(selectedSeats) ? selectedSeats.join(", ") : selectedSeats}
                </span>
              </div>
              <hr className="border-dashed border-gray-200" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Tổng tiền</span>
                <span className="font-black text-[#dc2626] text-lg">{finalTotalPrice?.toLocaleString()} đ</span>
              </div>
              <div className="flex flex-col items-center pt-3">
                <QRCodeSVG value={bookingCode} size={100} bgColor="transparent" fgColor="#111827" level="M" />
                <p className="text-[10px] text-gray-400 mt-2">{bookingCode}</p>
              </div>
            </div>
          </div>
        ) : isPendingCash ? (
          <div className="mx-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Clock className="w-12 h-12 text-amber-400" />
            <p className="font-mono font-bold text-gray-700 text-sm tracking-[0.15em] uppercase text-center">
              {bookingCode || "—"}
            </p>
            <p className="text-sm text-amber-600 font-bold text-center">
              Vui lòng đến quầy rạp và xuất trình mã đơn này để thanh toán
            </p>
          </div>
        ) : bookingCode ? (
          <div className="mx-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-black text-center">
              Đưa mã QR này cho nhân viên rạp xác nhận
            </p>
            <QRCodeSVG
              value={`${window.location.origin}/ticket/${bookingCode}`}
              size={200}
              bgColor="transparent"
              fgColor="#111827"
              level="M"
            />
            <p className="font-mono font-bold text-gray-700 text-sm tracking-[0.2em] uppercase">{bookingCode}</p>
          </div>
        ) : null}

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
          {isTicketIssued && bookingId && (
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
