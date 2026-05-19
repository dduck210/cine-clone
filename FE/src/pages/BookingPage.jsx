import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import {
  Minus,
  Plus,
  Calendar,
  MapPin,
  Ticket,
  Popcorn,
  CreditCard,
  Clock,
  AlertTriangle,
  Film,
  Armchair,
  ChevronRight,
} from "lucide-react";

const HOLD_SECONDS = 5 * 60;

const SEAT_COLORS = {
  normal: {
    available:
      "bg-white text-slate-700 border-2 border-slate-300 hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-red-50",
    selected:
      "bg-[#dc2626] text-white shadow-lg shadow-red-200 scale-110 ring-2 ring-red-100",
    locked:
      "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "Thường",
    dot: "bg-white border-2 border-slate-300",
    badge: "bg-slate-100 text-slate-600 border border-slate-300",
  },
  vip: {
    available:
      "bg-amber-50 text-amber-700 border-2 border-amber-400 hover:border-amber-600 hover:bg-amber-100",
    selected:
      "bg-amber-500 text-white shadow-lg shadow-amber-200 scale-110 ring-2 ring-amber-100",
    locked:
      "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "VIP",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-300",
  },
  couple: {
    available:
      "bg-pink-50 text-pink-700 border-2 border-pink-400 hover:border-pink-600 hover:bg-pink-100",
    selected:
      "bg-pink-500 text-white shadow-lg shadow-pink-200 scale-110 ring-2 ring-pink-100",
    locked:
      "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "Đôi",
    dot: "bg-pink-400",
    badge: "bg-pink-50 text-pink-700 border border-pink-300",
  },
};

function checkGapViolation(seatMap, seatsByRow, currentSelected, toggleSeatNum) {
  const tempSelected = currentSelected.includes(toggleSeatNum)
    ? currentSelected.filter((s) => s !== toggleSeatNum)
    : [...currentSelected, toggleSeatNum];

  const byRow = {};
  for (const sn of tempSelected) {
    const match = sn.match(/^([A-Z]+)(\d+)$/);
    if (!match) continue;
    const [, row, col] = match;
    if (!byRow[row]) byRow[row] = [];
    byRow[row].push(parseInt(col));
  }

  for (const [row, cols] of Object.entries(byRow)) {
    if (cols.length < 2) continue;
    cols.sort((a, b) => a - b);
    for (let i = 0; i < cols.length - 1; i++) {
      for (let gap = cols[i] + 1; gap < cols[i + 1]; gap++) {
        const gapSeatNum = `${row}${gap}`;
        const gapSeat = seatMap[gapSeatNum];
        if (gapSeat && gapSeat.status === "available" && !gapSeat.isLocked) {
          return `Không thể bỏ trống ghế ${gapSeatNum} giữa các ghế đã chọn`;
        }
      }
    }
  }
  return null;
}

/* ─── Ticket Bill Panel ─────────────────────────────────────────── */
const TicketBill = ({
  title,
  poster,
  cinemaName,
  showAddress,
  showDate,
  showTime,
  roomName,
  selectedSeats,
  seatMap,
  combos,
  updateCombo,
  totalTicketPrice,
  totalComboPrice,
  finalTotalPrice,
  isMonday,
  discountedPrice,
  timerStarted,
  secondsLeft,
  formatTime,
  onPay,
}) => {
  const isUrgent = timerStarted && secondsLeft <= 60;

  // Group selected seats by type
  const seatGroups = ["normal", "vip", "couple"].reduce((acc, type) => {
    const list = selectedSeats.filter((sn) => seatMap[sn]?.type === type);
    if (list.length > 0) acc[type] = list;
    return acc;
  }, {});

  return (
    <div className="w-full lg:w-[420px] shrink-0 sticky top-24 select-none">
      {/* ── Ticket container ── */}
      <div
        className="relative bg-white rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 50px -10px rgba(0,0,0,0.15)",
        }}
      >
        {/* ── TOP STUB: poster + movie info ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[160px]">
          {/* Blurred poster backdrop */}
          {poster && (
            <img
              src={poster}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-110 pointer-events-none"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-900/95 pointer-events-none" />

          <div className="relative z-10 p-6 flex gap-4 items-start">
            {/* Poster thumbnail */}
            <div className="shrink-0 w-[72px] h-[100px] rounded-xl overflow-hidden shadow-xl border-2 border-white/10 bg-slate-700">
              {poster ? (
                <img src={poster} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="text-slate-500 w-8 h-8" />
                </div>
              )}
            </div>

            {/* Movie title + meta */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-red-600 text-white px-2 py-0.5 rounded">
                  2D
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  Phụ đề Việt
                </span>
              </div>
              <h3 className="font-black text-white text-xl leading-tight line-clamp-2 mb-3">
                {title}
              </h3>
              {/* Countdown badge */}
              {timerStarted && (
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg ${
                    isUrgent
                      ? "bg-red-500/30 text-red-300 animate-pulse border border-red-500/40"
                      : "bg-white/10 text-slate-300 border border-white/10"
                  }`}
                >
                  <Clock size={11} />
                  {formatTime(secondsLeft)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── PERFORATION LINE ── */}
        <div className="relative flex items-center h-0 z-20">
          {/* left notch */}
          <div className="absolute -left-4 w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 shadow-inner" />
          {/* dashed line */}
          <div className="w-full border-t-2 border-dashed border-slate-200 mx-4" />
          {/* right notch */}
          <div className="absolute -right-4 w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 shadow-inner" />
        </div>

        {/* ── MAIN BODY ── */}
        <div className="bg-white px-6 pt-7 pb-0">
          {/* ── Venue & Time row ── */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Rạp chiếu
              </p>
              <p className="font-bold text-slate-800 text-sm leading-snug">{cinemaName}</p>
              {showAddress && (
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{showAddress}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Phòng chiếu
              </p>
              <p className="font-bold text-slate-800 text-sm">
                {roomName || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Ngày chiếu
              </p>
              <p className="font-bold text-slate-800 text-sm">{showDate || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Giờ chiếu
              </p>
              <p className="font-black text-red-600 text-lg leading-none">{showTime || "—"}</p>
            </div>
          </div>

          {/* ── Seats section ── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Armchair size={12} /> Ghế đã chọn
              </p>
              {selectedSeats.length > 0 && (
                <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedSeats.length} ghế
                </span>
              )}
            </div>

            {selectedSeats.length === 0 ? (
              <div className="flex items-center gap-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-4 py-4 text-slate-400">
                <Armchair size={18} className="shrink-0" />
                <span className="text-sm font-medium">Chưa chọn ghế nào</span>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(seatGroups).map(([type, seats]) => {
                  const colors = SEAT_COLORS[type];
                  const priceEach = seatMap[seats[0]]?.price || 0;
                  const subtotal = priceEach * seats.length;
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100"
                    >
                      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 mr-3">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${colors.badge}`}
                        >
                          {colors.label}
                        </span>
                        {/* Seat number chips */}
                        <div className="flex flex-wrap gap-1">
                          {seats.map((sn) => (
                            <span
                              key={sn}
                              className="text-[11px] font-bold bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md shadow-sm"
                            >
                              {sn}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-800">
                          {subtotal.toLocaleString()}₫
                        </p>
                        {seats.length > 1 && (
                          <p className="text-[10px] text-slate-400">
                            {priceEach.toLocaleString()}₫ × {seats.length}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Combos section ── */}
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Popcorn size={12} /> Combo ưu đãi
            </p>
            <div className="space-y-2">
              {[
                { id: 1, name: "Combo Solo", detail: "1 Bắp + 1 Nước ngọt", price: 80000 },
                { id: 2, name: "Combo Couple", detail: "1 Bắp lớn + 2 Nước", price: 150000 },
              ].map((combo) => {
                const current = combos.find((c) => c.id === combo.id);
                const qty = current?.quantity ?? 0;
                return (
                  <div
                    key={combo.id}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 hover:border-slate-200 transition-colors"
                  >
                    {/* icon */}
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-base">
                      🍿
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 leading-none">{combo.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{combo.detail}</p>
                    </div>
                    <div className="shrink-0 text-right mr-1">
                      <p className="text-xs font-black text-red-600">
                        {combo.price.toLocaleString()}₫
                      </p>
                    </div>
                    {/* Stepper */}
                    <div className="shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-1">
                      <button
                        onClick={() => updateCombo(combo.id, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Minus size={10} strokeWidth={3} />
                      </button>
                      <span className="font-black text-sm w-4 text-center text-slate-800">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateCombo(combo.id, 1)}
                        className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Plus size={10} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── SECOND PERFORATION ── */}
        <div className="relative flex items-center h-0 z-20">
          <div className="absolute -left-4 w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 shadow-inner" />
          <div className="w-full border-t-2 border-dashed border-slate-200 mx-4" />
          <div className="absolute -right-4 w-8 h-8 rounded-full bg-slate-100 border border-slate-200/60 shadow-inner" />
        </div>

        {/* ── FOOTER STUB: price + button ── */}
        <div className="bg-white px-6 pt-6 pb-6 rounded-b-2xl">
          {/* Price breakdown */}
          {selectedSeats.length > 0 && (
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Vé ({selectedSeats.length} ghế)</span>
                <span className="font-semibold">{totalTicketPrice.toLocaleString()}₫</span>
              </div>
              {totalComboPrice > 0 && (
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Combo</span>
                  <span className="font-semibold">{totalComboPrice.toLocaleString()}₫</span>
                </div>
              )}
              {isMonday && (
                <div className="flex justify-between text-xs text-green-600 font-bold">
                  <span>🎉 Giảm giá Thứ Hai (−20%)</span>
                  <span>−{Math.round(finalTotalPrice * 0.2).toLocaleString()}₫</span>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          {selectedSeats.length > 0 && (
            <div className="border-t border-slate-100 mb-4" />
          )}

          {/* Total */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tổng thanh toán
              </p>
              {isMonday && finalTotalPrice > 0 && (
                <p className="text-sm text-slate-400 line-through leading-none mt-0.5">
                  {finalTotalPrice.toLocaleString()}₫
                </p>
              )}
            </div>
            <p className="text-3xl font-black text-slate-900 leading-none">
              {discountedPrice > 0 ? (
                <>
                  {discountedPrice.toLocaleString()}
                  <span className="text-lg text-slate-400 ml-0.5">₫</span>
                </>
              ) : (
                <span className="text-slate-300 text-2xl">—</span>
              )}
            </p>
          </div>

          {/* CTA Button */}
          <button
            disabled={selectedSeats.length === 0}
            onClick={onPay}
            className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              selectedSeats.length === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            <CreditCard size={16} />
            Thanh toán ngay
            {selectedSeats.length > 0 && (
              <ChevronRight size={16} className="ml-auto opacity-70" />
            )}
          </button>

          {selectedSeats.length === 0 && (
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Vui lòng chọn ít nhất 1 ghế để tiếp tục
            </p>
          )}
        </div>
      </div>

      {/* ── Monday badge (floating) ── */}
      {isMonday && (
        <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm">
          <span className="text-base">🎉</span>
          <span>Thứ Hai vui vẻ — Giảm 20% tất cả vé hôm nay!</span>
        </div>
      )}
    </div>
  );
};

/* ─── Main BookingPage ──────────────────────────────────────────── */
const BookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { selectedShowtime, movieTitle, poster } = location.state || {};
  const roomName = selectedShowtime?.roomName || "";

  const showtimeId = selectedShowtime?.showtimeId;
  const cinemaName = selectedShowtime?.cinemaName || "5Cine";
  const showTime = selectedShowtime?.time || "";
  const showAddress = selectedShowtime?.address || "";

  const [showtimeData, setShowtimeData] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatMap, setSeatMap] = useState({});
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [gapError, setGapError] = useState("");

  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);

  const [combos, setCombos] = useState([
    { id: 1, name: "Combo Solo", detail: "1 Bắp + 1 Nước ngọt", price: 80000, quantity: 0 },
    { id: 2, name: "Combo Couple", detail: "1 Bắp lớn + 2 Nước", price: 150000, quantity: 0 },
  ]);

  useEffect(() => {
    if (!showtimeId) { setLoadingSeats(false); return; }
    axiosInstance
      .get(`/showtimes/${showtimeId}`)
      .then((res) => {
        setShowtimeData(res.data.data);
        const seatList = res.data.seats || [];
        setSeats(seatList);
        const map = {};
        for (const s of seatList) map[s.seatNumber] = s;
        setSeatMap(map);
      })
      .catch(() => setSeats([]))
      .finally(() => setLoadingSeats(false));
  }, [showtimeId]);

  useEffect(() => {
    if (selectedSeats.length > 0 && !timerStarted) setTimerStarted(true);
  }, [selectedSeats, timerStarted]);

  useEffect(() => {
    if (!timerStarted) return;
    if (secondsLeft <= 0) { alert("Hết thời gian giữ ghế! Vui lòng chọn lại."); navigate(-1); return; }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [timerStarted, secondsLeft, navigate]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const updateCombo = (comboId, delta) =>
    setCombos(combos.map((c) => (c.id === comboId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)));

  const handleSeatClick = useCallback(
    (seatNum) => {
      const seat = seatMap[seatNum];
      if (!seat || seat.status === "reserved" || seat.status === "booked" || seat.isLocked) return;
      const error = checkGapViolation(seatMap, seats, selectedSeats, seatNum);
      if (error) { setGapError(error); setTimeout(() => setGapError(""), 3000); return; }
      setGapError("");
      setSelectedSeats((prev) =>
        prev.includes(seatNum) ? prev.filter((s) => s !== seatNum) : [...prev, seatNum]
      );
    },
    [seatMap, seats, selectedSeats]
  );

  const handleCoupleSeatClick = useCallback(
    (seatNumA, seatNumB) => {
      const seatA = seatMap[seatNumA];
      const seatB = seatMap[seatNumB];
      if (!seatA || !seatB) return;
      const bothSelected = selectedSeats.includes(seatNumA) && selectedSeats.includes(seatNumB);
      setGapError("");
      if (bothSelected) {
        setSelectedSeats((prev) => prev.filter((s) => s !== seatNumA && s !== seatNumB));
      } else {
        setSelectedSeats((prev) => {
          const next = [...prev];
          if (!next.includes(seatNumA)) next.push(seatNumA);
          if (!next.includes(seatNumB)) next.push(seatNumB);
          return next;
        });
      }
    },
    [seatMap, selectedSeats]
  );

  const rows = [...new Set(seats.map((s) => s.row))].sort();
  const maxCol = seats.length > 0 ? Math.max(...seats.map((s) => s.col)) : 12;
  const priceConfig = showtimeData?.priceConfig || {};

  const totalTicketPrice = selectedSeats.reduce((sum, sn) => sum + (seatMap[sn]?.price || 0), 0);
  const totalComboPrice = combos.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const finalTotalPrice = totalTicketPrice + totalComboPrice;

  const showtimeDay = selectedShowtime?.date
    ? new Date(selectedShowtime.date).getDay()
    : new Date().getDay();
  const isMonday = showtimeDay === 1;
  const discountedPrice = isMonday ? Math.round(finalTotalPrice * 0.8) : finalTotalPrice;

  const showDate = selectedShowtime?.date
    ? new Date(selectedShowtime.date).toLocaleDateString("vi-VN", {
        weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
      })
    : new Date().toLocaleDateString("vi-VN", {
        weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
      });

  const title = movieTitle || "Đang tải...";
  const isUrgent = timerStarted && secondsLeft <= 60;

  const handlePay = () => {
    navigate("/payment", {
      state: {
        showtimeId,
        movieTitle: title,
        poster,
        cinemaName,
        showTime,
        showDate,
        showAddress,
        selectedSeats,
        combos,
        finalTotalPrice: discountedPrice,
        roomName,
        seatMap: Object.fromEntries(
          selectedSeats.map((sn) => [sn, { type: seatMap[sn]?.type, price: seatMap[sn]?.price }])
        ),
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 bg-red-600 rounded-full" />
          <h1 className="text-2xl font-extrabold text-slate-900">Chọn ghế của bạn</h1>
        </div>

        {/* ── Gap error toast ── */}
        {gapError && (
          <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium shadow-sm">
            <AlertTriangle size={16} className="shrink-0" />
            {gapError}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ── LEFT: Seat map (unchanged logic) ── */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 w-full overflow-x-auto">
            {/* Screen */}
            <div className="w-full h-12 sm:h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-16 shadow-inner border border-slate-200 relative overflow-hidden shrink-0 min-w-[600px]">
              <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-slate-300 to-transparent opacity-50" />
              <span className="text-slate-400 font-bold tracking-[0.5em] text-xs sm:text-sm uppercase">
                Màn hình chiếu
              </span>
            </div>

            {loadingSeats ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" />
              </div>
            ) : seats.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-bold">
                Không tải được sơ đồ ghế. Vui lòng thử lại.
              </div>
            ) : (
              <div className="flex justify-center overflow-x-auto pb-4">
                <div className="flex flex-col gap-3 min-w-max px-2">
                  {rows.map((row) => {
                    const elements = [];
                    let i = 0;
                    while (i < maxCol) {
                      const col = i + 1;
                      const seatNum = `${row}${col}`;
                      const seat = seatMap[seatNum];
                      const isMiddle = col === Math.floor(maxCol / 2);

                      if (!seat) {
                        elements.push(
                          <div key={seatNum} className={`w-9 h-9 sm:w-11 sm:h-11 ${isMiddle ? "mr-6 sm:mr-10" : ""}`} />
                        );
                        i++; continue;
                      }

                      const seatType = seat.type || "normal";

                      if (seatType === "couple") {
                        const nextCol = col + 1;
                        const nextSeatNum = `${row}${nextCol}`;
                        const nextSeat = seatMap[nextSeatNum];
                        if (nextSeat && nextSeat.type === "couple") {
                          const colors = SEAT_COLORS.couple;
                          const isSelected =
                            selectedSeats.includes(seatNum) || selectedSeats.includes(nextSeatNum);
                          const isUnavailable =
                            seat.status === "reserved" || seat.status === "booked" || seat.isLocked ||
                            nextSeat.status === "reserved" || nextSeat.status === "booked" || nextSeat.isLocked;
                          elements.push(
                            <button
                              key={`${seatNum}-couple`}
                              disabled={isUnavailable}
                              onClick={() => handleCoupleSeatClick(seatNum, nextSeatNum)}
                              title={`${seatNum} & ${nextSeatNum} - Đôi - ${((seat.price || 0) * 2).toLocaleString()}đ`}
                              className={`h-9 sm:h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${isMiddle ? "mr-6 sm:mr-10" : ""} ${
                                isUnavailable ? colors.locked : isSelected ? colors.selected : colors.available
                              }`}
                              style={{ width: "calc(2 * 2.75rem + 0.5rem)" }}
                            >
                              <span>{col}</span>
                              <span className="opacity-40 text-[10px]">♥</span>
                              <span>{nextCol}</span>
                            </button>
                          );
                          i += 2; continue;
                        }
                      }

                      const colors = SEAT_COLORS[seatType] || SEAT_COLORS.normal;
                      const isSelected = selectedSeats.includes(seatNum);
                      const isUnavailable =
                        seat.status === "reserved" || seat.status === "booked" || seat.isLocked;
                      elements.push(
                        <button
                          key={seatNum}
                          disabled={isUnavailable}
                          onClick={() => handleSeatClick(seatNum)}
                          title={`${seatNum} - ${colors.label} - ${(seat.price || 0).toLocaleString()}đ`}
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${isMiddle ? "mr-6 sm:mr-10" : ""} ${
                            isUnavailable ? colors.locked : isSelected ? colors.selected : colors.available
                          }`}
                        >
                          {col}
                        </button>
                      );
                      i++;
                    }

                    return (
                      <div key={row} className="flex gap-2 sm:gap-3 items-center justify-center">
                        <span className="w-6 text-slate-400 font-bold text-xs sm:text-sm text-center">{row}</span>
                        {elements}
                        <span className="w-6 text-slate-400 font-bold text-xs sm:text-sm text-center">{row}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-16 border-t border-slate-100 pt-8">
              {Object.entries(SEAT_COLORS).map(([type, c]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md ${c.dot}`} />
                  <div>
                    <span className="text-slate-600 text-sm font-medium">{c.label}</span>
                    {priceConfig[type] && (
                      <span className="block text-xs text-slate-400">
                        {priceConfig[type].toLocaleString()}đ
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center">
                  <span className="text-slate-400 text-xs font-bold">X</span>
                </div>
                <span className="text-slate-600 text-sm font-medium">Đã đặt / Khoá</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#dc2626]" />
                <span className="text-slate-600 text-sm font-medium">Đang chọn</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Redesigned ticket bill ── */}
          <TicketBill
            title={title}
            poster={poster}
            cinemaName={cinemaName}
            showAddress={showAddress}
            showDate={showDate}
            showTime={showTime}
            roomName={roomName}
            selectedSeats={selectedSeats}
            seatMap={seatMap}
            combos={combos}
            updateCombo={updateCombo}
            totalTicketPrice={totalTicketPrice}
            totalComboPrice={totalComboPrice}
            finalTotalPrice={finalTotalPrice}
            isMonday={isMonday}
            discountedPrice={discountedPrice}
            timerStarted={timerStarted}
            secondsLeft={secondsLeft}
            formatTime={formatTime}
            onPay={handlePay}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPage;
