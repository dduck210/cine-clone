import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import {
  Minus, Plus, Calendar, MapPin, Ticket, Popcorn,
  CreditCard, Clock, AlertTriangle, ChevronRight, ChevronLeft,
} from "lucide-react";

const HOLD_SECONDS = 5 * 60;

const SEAT_COLORS = {
  normal: {
    available: "bg-white text-slate-700 border-2 border-slate-300 hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-red-50",
    selected: "bg-[#dc2626] text-white shadow-lg shadow-red-200 scale-110 ring-2 ring-red-100",
    locked: "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "Thường", dot: "bg-white border-2 border-slate-300",
  },
  vip: {
    available: "bg-amber-50 text-amber-700 border-2 border-amber-400 hover:border-amber-600 hover:bg-amber-100",
    selected: "bg-amber-500 text-white shadow-lg shadow-amber-200 scale-110 ring-2 ring-amber-100",
    locked: "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "VIP", dot: "bg-amber-400",
  },
  couple: {
    available: "bg-pink-50 text-pink-700 border-2 border-pink-400 hover:border-pink-600 hover:bg-pink-100",
    selected: "bg-pink-500 text-white shadow-lg shadow-pink-200 scale-110 ring-2 ring-pink-100",
    locked: "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "Đôi", dot: "bg-pink-400",
  },
};

function checkGapViolation(seatMap, seats, currentSelected, toggleSeatNum) {
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
        const gapSeat = seatMap[`${row}${gap}`];
        if (gapSeat && gapSeat.status === "available" && !gapSeat.isLocked)
          return `Không thể bỏ trống ghế ${row}${gap} giữa các ghế đã chọn`;
      }
    }
  }
  return null;
}

const COMBOS = [
  { id: 1, name: "Combo Solo", detail: "1 Bắp rang + 1 Nước ngọt vừa", price: 80000, emoji: "🍿" },
  { id: 2, name: "Combo Couple", detail: "1 Bắp rang lớn + 2 Nước ngọt", price: 150000, emoji: "🍿🥤" },
  { id: 3, name: "Combo Gia đình", detail: "2 Bắp rang lớn + 3 Nước ngọt", price: 250000, emoji: "🎉" },
];

const BookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { selectedShowtime, movieTitle, poster, selectedDate } = location.state || {};
  const roomName = selectedShowtime?.roomName || "";
  const showtimeId = selectedShowtime?.showtimeId;
  const cinemaName = selectedShowtime?.cinemaName || "5Cine";
  const showTime = selectedShowtime?.time || "";
  const showAddress = selectedShowtime?.address || "";

  const [step, setStep] = useState(1); // 1 = chọn ghế, 2 = chọn combo

  const [showtimeData, setShowtimeData] = useState(null);
  const [seats, setSeats] = useState([]);

  // Auto-scale seat map to fit container width
  const seatOuterRef = useRef(null);
  const seatInnerRef = useRef(null);
  const naturalWidthRef = useRef(null);
  const [seatScale, setSeatScale] = useState(1);

  const recalcScale = useCallback(() => {
    if (!seatOuterRef.current || !naturalWidthRef.current) return;
    const available = seatOuterRef.current.clientWidth;
    setSeatScale(Math.min(1, available / naturalWidthRef.current));
  }, []);

  useEffect(() => {
    if (!seatInnerRef.current || !seatOuterRef.current) return;
    const t = setTimeout(() => {
      if (!seatInnerRef.current) return;
      naturalWidthRef.current = seatInnerRef.current.scrollWidth;
      recalcScale();
    }, 80);
    return () => clearTimeout(t);
  }, [seats, recalcScale]);

  useEffect(() => {
    window.addEventListener("resize", recalcScale);
    return () => window.removeEventListener("resize", recalcScale);
  }, [recalcScale]);
  const [seatMap, setSeatMap] = useState({});
  const [loadingSeats, setLoadingSeats] = useState(() => !!showtimeId);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [gapError, setGapError] = useState("");
  const [fallbackShowDate] = useState(() => new Date());

  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);

  const [combos, setCombos] = useState(COMBOS.map((c) => ({ ...c, quantity: 0 })));

  useEffect(() => {
    if (!showtimeId) return;
    axiosInstance.get(`/showtimes/${showtimeId}`)
      .then((res) => {
        setShowtimeData(res.data.data);
        const seatList = res.data.seats || [];
        setSeats(seatList);
        const map = {};
        for (const s of seatList) map[s.seatNumber] = s;
        setSeatMap(map);
      })
      .catch((error) => {
        setSeats([]);
        if (error?.response?.status === 410) {
          window.alert("Suất chiếu này đã hết hạn hoặc không còn khả dụng. Vui lòng chọn suất khác.");
          navigate(`/movie/${id}`);
        }
      })
      .finally(() => setLoadingSeats(false));
  }, [showtimeId, navigate, id]);

  useEffect(() => {
    if (!timerStarted) return;
    if (secondsLeft <= 0) { alert("Hết thời gian giữ ghế! Vui lòng chọn lại."); navigate(-1); return; }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [timerStarted, secondsLeft, navigate]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const updateCombo = (comboId, delta) =>
    setCombos(combos.map((c) => (c.id === comboId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)));

  const checkMixTypeViolation = (currentSelected, addingType) => {
    const existingTypes = new Set(currentSelected.map(sn => seatMap[sn]?.type || "normal"));
    if (existingTypes.size === 0 || existingTypes.has(addingType)) return null;
    return "Chỉ được chọn 1 loại ghế trong cùng một đơn";
  };

  const handleSeatClick = (seatNum) => {
    const seat = seatMap[seatNum];
    if (!seat || seat.status === "reserved" || seat.status === "booked" || seat.isLocked) return;

    const isDeselecting = selectedSeats.includes(seatNum);
    if (!isDeselecting) {
      const typeError = checkMixTypeViolation(selectedSeats, seat.type || "normal");
      if (typeError) { setGapError(typeError); setTimeout(() => setGapError(""), 3500); return; }
    }

    const gapError = checkGapViolation(seatMap, seats, selectedSeats, seatNum);
    if (gapError) { setGapError(gapError); setTimeout(() => setGapError(""), 3000); return; }

    setGapError("");
    setSelectedSeats((prev) => {
      const next = prev.includes(seatNum) ? prev.filter((s) => s !== seatNum) : [...prev, seatNum];
      if (next.length > 0 && !timerStarted) setTimerStarted(true);
      return next;
    });
  };

  const handleCoupleSeatClick = (seatNumA, seatNumB) => {
    const seatA = seatMap[seatNumA]; const seatB = seatMap[seatNumB];
    if (!seatA || !seatB) return;
    const bothSelected = selectedSeats.includes(seatNumA) && selectedSeats.includes(seatNumB);
    setGapError("");
    if (bothSelected) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seatNumA && s !== seatNumB));
    } else {
      const typeError = checkMixTypeViolation(selectedSeats, "couple");
      if (typeError) { setGapError(typeError); setTimeout(() => setGapError(""), 3500); return; }
      setSelectedSeats((prev) => {
        const next = [...prev];
        if (!next.includes(seatNumA)) next.push(seatNumA);
        if (!next.includes(seatNumB)) next.push(seatNumB);
        if (next.length > 0 && !timerStarted) setTimerStarted(true);
        return next;
      });
    }
  };

  const rows = [...new Set(seats.map((s) => s.row))].sort();
  const maxCol = seats.length > 0 ? Math.max(...seats.map((s) => s.col)) : 12;
  const priceConfig = showtimeData?.priceConfig || {};

  const totalTicketPrice = selectedSeats.reduce((sum, sn) => sum + (seatMap[sn]?.price || 0), 0);
  const totalComboPrice = combos.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const finalTotalPrice = totalTicketPrice + totalComboPrice;

  // Always use Vietnam timezone (UTC+7) for Monday discount check
  const isMonday = (() => {
    const vnStr = (d) => new Date(+d + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
    const s = selectedDate || (selectedShowtime?.date ? vnStr(new Date(selectedShowtime.date)) : null);
    if (!s) return new Date(+new Date() + 7 * 60 * 60 * 1000).getUTCDay() === 1;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === 1;
  })();
  const discountedPrice = isMonday ? Math.round(finalTotalPrice * 0.8) : finalTotalPrice;

  const showDate = new Date(selectedShowtime?.date || fallbackShowDate).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });

  const title = movieTitle || "Đang tải...";
  const isUrgent = timerStarted && secondsLeft <= 60;
  const activeCombos = combos.filter((c) => c.quantity > 0);

  const goToPayment = () => navigate("/payment", {
    state: {
      showtimeId, movieTitle: title, poster, cinemaName, showTime, showDate,
      showAddress, selectedSeats, combos, finalTotalPrice: discountedPrice, roomName,
      seatMap: Object.fromEntries(selectedSeats.map((sn) => [sn, { type: seatMap[sn]?.type, price: seatMap[sn]?.price }])),
    },
  });

  // Step indicator
  const renderStepBar = () => (
    <div className="flex items-center gap-2 mb-6">
      {["Chọn ghế", "Chọn combo"].map((label, i) => {
        const s = i + 1;
        const active = step === s;
        const done = step > s;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${active ? "bg-[#dc2626] text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                {done ? "✓" : s}
              </div>
              <span className={`text-sm font-bold hidden sm:inline ${active ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
            </div>
            {i < 1 && <div className={`flex-1 h-0.5 max-w-[60px] transition-all ${done ? "bg-emerald-500" : "bg-slate-200"}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Right summary panel (both steps)
  const renderSummaryPanel = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
      <div className="bg-slate-900 p-6 text-white relative overflow-hidden shrink-0">
        <div className="relative z-10">
          <h3 className="font-extrabold text-xl mb-2 line-clamp-2 pr-10">{title}</h3>
          <p className="text-slate-300 text-sm flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">2D</span>
            <span>Phụ đề Tiếng Việt</span>
          </p>
        </div>
        <Ticket className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
      </div>

      <div className="p-5 flex-1 flex flex-col bg-[#fafafa] space-y-4">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-[#dc2626] mt-0.5 shrink-0" />
          <div><p className="font-bold text-slate-800">{cinemaName}</p><p className="text-xs text-slate-500">{showAddress}</p></div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="w-4 h-4 text-[#dc2626] mt-0.5 shrink-0" />
          <div><p className="font-bold text-slate-800">{showDate}</p><p className="text-xs text-slate-500">{showTime}</p></div>
        </div>

        <div className="border-t border-dashed border-slate-200 pt-3 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Ghế</span>
            <span className="font-black text-slate-900 text-right max-w-[160px] break-words">
              {selectedSeats.length > 0 ? selectedSeats.join(", ") : "—"}
            </span>
          </div>
          {selectedSeats.length > 0 && (
            <div className="text-right">
              <span className="text-xs text-slate-500">{selectedSeats.length} ghế · {totalTicketPrice.toLocaleString()}đ</span>
            </div>
          )}
        </div>

        {activeCombos.length > 0 && (
          <div className="border-t border-dashed border-slate-200 pt-3 space-y-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Combo</span>
            {activeCombos.map((c) => (
              <div key={c.id} className="flex justify-between text-sm">
                <span className="text-slate-600">{c.name} ×{c.quantity}</span>
                <span className="font-bold text-slate-800">{(c.price * c.quantity).toLocaleString()}đ</span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t-2 border-dashed border-slate-300 pt-3 mt-auto">
          {isMonday && (
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Gốc</span>
              <span className="line-through">{finalTotalPrice.toLocaleString()}đ</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-700 text-sm">Tổng cộng</span>
            <span className="font-black text-[#dc2626] text-2xl">{discountedPrice.toLocaleString()}<span className="text-sm"> ₫</span></span>
          </div>
          {isMonday && <p className="text-right text-xs text-emerald-600 font-bold mt-0.5">Đã giảm 20% Thứ Hai 🎉</p>}
        </div>

        {step === 1 ? (
          <button
            disabled={selectedSeats.length === 0}
            onClick={() => setStep(2)}
            className={`w-full font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${selectedSeats.length === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 text-white shadow-lg shadow-red-200"}`}
          >
            Tiếp tục <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={goToPayment}
            className="w-full font-black py-3.5 rounded-xl bg-[#dc2626] hover:bg-red-700 text-white shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <CreditCard size={16} /> Thanh toán ngay
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-28 pb-28 lg:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          {renderStepBar()}
          {timerStarted && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${isUrgent ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-600"}`}>
              <Clock size={16} />
              Giữ ghế: <span className="font-black text-base">{formatTime(secondsLeft)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT panel */}
          <div className="flex-1 min-w-0 w-full">

            {/* ── STEP 1: Seat map ── */}
            {step === 1 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-8">
                {gapError && (
                  <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                    <AlertTriangle size={16} />{gapError}
                  </div>
                )}

                <h2 className="text-base font-bold text-slate-700 mb-4">Sơ đồ ghế</h2>

                {/* Seat grid — auto-scale to fit, pinch-zoom to enlarge */}
                <div ref={seatOuterRef} className="overflow-hidden w-full">
                  <div ref={seatInnerRef} style={{ zoom: seatScale, transformOrigin: "top left" }}>
                    <div className="w-full h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-12 shadow-inner border border-slate-200 relative overflow-hidden min-w-[520px]">
                      <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-slate-300 to-transparent opacity-50" />
                      <span className="text-slate-400 font-bold tracking-[0.5em] text-xs uppercase">Màn hình chiếu</span>
                    </div>

                    {loadingSeats ? (
                      <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" /></div>
                    ) : seats.length === 0 ? (
                      <div className="text-center py-16 text-gray-400 font-bold">Không tải được sơ đồ ghế.</div>
                    ) : (
                      <div className="flex justify-center pb-4">
                        <div className="flex flex-col gap-2.5 min-w-max px-2">
                          {rows.map((row) => {
                            const elements = [];
                            let i = 0;
                            while (i < maxCol) {
                              const col = i + 1;
                              const seatNum = `${row}${col}`;
                              const seat = seatMap[seatNum];
                              const isMiddle = col === Math.floor(maxCol / 2);
                              if (!seat) {
                                elements.push(<div key={seatNum} className={`w-9 h-9 ${isMiddle ? "mr-8" : ""}`} />);
                                i++; continue;
                              }
                              const seatType = seat.type || "normal";
                              if (seatType === "couple") {
                                const nextSeatNum = `${row}${col + 1}`;
                                const nextSeat = seatMap[nextSeatNum];
                                if (nextSeat?.type === "couple") {
                                  const colors = SEAT_COLORS.couple;
                                  const isSelected = selectedSeats.includes(seatNum) || selectedSeats.includes(nextSeatNum);
                                  const isUnavailable = seat.status === "reserved" || seat.status === "booked" || seat.isLocked || nextSeat.status === "reserved" || nextSeat.status === "booked" || nextSeat.isLocked;
                                  elements.push(
                                    <button key={`${seatNum}-couple`} disabled={isUnavailable}
                                      onClick={() => handleCoupleSeatClick(seatNum, nextSeatNum)}
                                      title={`${seatNum} & ${nextSeatNum} - Đôi`}
                                      className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${isMiddle ? "mr-8" : ""} ${isUnavailable ? colors.locked : isSelected ? colors.selected : colors.available}`}
                                      style={{ width: "calc(2 * 2.25rem + 0.5rem)" }}>
                                      <span>{col}</span><span className="opacity-40 text-[10px]">♥</span><span>{col + 1}</span>
                                    </button>
                                  );
                                  i += 2; continue;
                                }
                              }
                              const colors = SEAT_COLORS[seatType] || SEAT_COLORS.normal;
                              const isSelected = selectedSeats.includes(seatNum);
                              const isUnavailable = seat.status === "reserved" || seat.status === "booked" || seat.isLocked;
                              elements.push(
                                <button key={seatNum} disabled={isUnavailable} onClick={() => handleSeatClick(seatNum)}
                                  title={`${seatNum} - ${colors.label} - ${(seat.price || 0).toLocaleString()}đ`}
                                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${isMiddle ? "mr-8" : ""} ${isUnavailable ? colors.locked : isSelected ? colors.selected : colors.available}`}>
                                  {col}
                                </button>
                              );
                              i++;
                            }
                            return (
                              <div key={row} className="flex gap-2 items-center justify-center">
                                <span className="w-5 text-slate-400 font-bold text-xs text-center">{row}</span>
                                {elements}
                                <span className="w-5 text-slate-400 font-bold text-xs text-center">{row}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-8 border-t border-slate-100 pt-6">
                  {Object.entries(SEAT_COLORS).map(([type, c]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-md ${c.dot}`} />
                      <div>
                        <span className="text-slate-600 text-xs font-medium">{c.label}</span>
                        {priceConfig[type] && <span className="block text-[10px] text-slate-400">{priceConfig[type].toLocaleString()}đ</span>}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center"><span className="text-slate-400 text-[10px] font-bold">X</span></div>
                    <span className="text-slate-600 text-xs font-medium">Đã đặt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#dc2626]" />
                    <span className="text-slate-600 text-xs font-medium">Đang chọn</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Combo selection ── */}
            {step === 2 && (
              <div className="space-y-4">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">
                  <ChevronLeft size={18} /> Quay lại chọn ghế
                </button>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h2 className="font-extrabold text-lg text-slate-800 mb-1 flex items-center gap-2">
                    <Popcorn size={20} className="text-[#dc2626]" /> Thêm combo bắp nước
                  </h2>
                  <p className="text-sm text-slate-400 mb-6">Không bắt buộc — bỏ qua để thanh toán ngay</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {combos.map((combo) => (
                      <div key={combo.id} className={`rounded-2xl border-2 p-5 flex flex-col gap-3 transition-all ${combo.quantity > 0 ? "border-[#dc2626] bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                        <div className="text-3xl">{combo.emoji}</div>
                        <div className="flex-1">
                          <p className="font-extrabold text-slate-900">{combo.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{combo.detail}</p>
                          <p className="font-black text-[#dc2626] text-lg mt-2">{combo.price.toLocaleString()}<span className="text-sm">đ</span></p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-slate-100 px-3 py-2 rounded-xl">
                            <button onClick={() => updateCombo(combo.id, -1)} className="text-slate-500 hover:text-[#dc2626] transition-colors">
                              <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="font-black text-sm w-5 text-center">{combo.quantity}</span>
                            <button onClick={() => updateCombo(combo.id, 1)} className="text-slate-500 hover:text-[#dc2626] transition-colors">
                              <Plus size={14} strokeWidth={3} />
                            </button>
                          </div>
                          {combo.quantity > 0 && (
                            <span className="text-xs font-bold text-[#dc2626]">{(combo.price * combo.quantity).toLocaleString()}đ</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Summary panel (desktop only) */}
          <div className="hidden lg:block w-full lg:w-[400px] shrink-0 sticky top-28">
            {renderSummaryPanel()}
          </div>
        </div>
      </main>

      {/* Mobile sticky bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {selectedSeats.length > 0 ? (
            <>
              <p className="text-white font-black text-lg leading-none">{discountedPrice.toLocaleString()} ₫</p>
              <p className="text-slate-400 text-xs mt-0.5 truncate">{selectedSeats.length} ghế · {selectedSeats.join(", ")}</p>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Chọn ghế để tiếp tục</p>
          )}
        </div>
        {step === 1 ? (
          <button
            disabled={selectedSeats.length === 0}
            onClick={() => setStep(2)}
            className={`shrink-0 font-black px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${selectedSeats.length === 0 ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-[#dc2626] text-white"}`}
          >
            Tiếp tục <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={goToPayment}
            className="shrink-0 font-black px-5 py-2.5 rounded-xl text-sm bg-[#dc2626] text-white flex items-center gap-2"
          >
            <CreditCard size={16} /> Thanh toán
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BookingPage;
