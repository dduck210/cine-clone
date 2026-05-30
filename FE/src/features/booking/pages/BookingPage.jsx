import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/shared/components/common/Navbar";
import Footer from "@/shared/components/common/Footer";
import axiosInstance from "@/api/axiosConfig";
import {
  Calendar, MapPin, CreditCard, Clock,
  ChevronRight, ChevronLeft,
} from "lucide-react";
import { COMBOS } from "@/features/booking/data/combos-data";
import SeatSelector from "@/features/booking/components/SeatSelector";
import ComboSelector from "@/features/booking/components/ComboSelector";
import BookingSummaryPanel from "@/features/booking/components/BookingSummaryPanel";
import { SeatInfoModal, TimerExpiredModal } from "@/features/booking/components/BookingModals";

const HOLD_SECONDS = 5 * 60;

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

  const [step, setStep] = useState(1);
  const [showSeatInfo, setShowSeatInfo] = useState(false);
  const [showtimeData, setShowtimeData] = useState(null);
  const duration = selectedShowtime?.duration || showtimeData?.movie?.duration || 0;
  const [seats, setSeats] = useState([]);

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
  const [seatLoadError, setSeatLoadError] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [justSelected, setJustSelected] = useState(new Set());
  const [gapError, setGapError] = useState("");
  const [fallbackShowDate] = useState(() => new Date());

  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const warnedRef = useRef(false);

  const [combos, setCombos] = useState(COMBOS.map((c) => ({ ...c, quantity: 0 })));
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);

  const loadSeats = useCallback(() => {
    if (!showtimeId) return;
    setLoadingSeats(true);
    setSeatLoadError(false);
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
        } else {
          setSeatLoadError(true);
        }
      })
      .finally(() => setLoadingSeats(false));
  }, [showtimeId, navigate, id]);

  useEffect(() => { loadSeats(); }, [loadSeats]);

  useEffect(() => {
    if (!timerStarted) return;
    if (secondsLeft <= 0) { setTimerExpired(true); return; }
    if (secondsLeft === 60 && !warnedRef.current) {
      warnedRef.current = true;
    }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [timerStarted, secondsLeft]);

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
    const gapErr = checkGapViolation(seatMap, seats, selectedSeats, seatNum);
    if (gapErr) { setGapError(gapErr); setTimeout(() => setGapError(""), 3000); return; }
    setGapError("");
    const isAdding = !selectedSeats.includes(seatNum);
    setSelectedSeats((prev) => {
      const next = prev.includes(seatNum) ? prev.filter((s) => s !== seatNum) : [...prev, seatNum];
      if (next.length > 0 && !timerStarted) setTimerStarted(true);
      return next;
    });
    if (isAdding) {
      setJustSelected(new Set([seatNum]));
      setTimeout(() => setJustSelected(new Set()), 250);
    }
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
      setJustSelected(new Set([seatNumA, seatNumB]));
      setTimeout(() => setJustSelected(new Set()), 250);
    }
  };

  const rows = [...new Set(seats.map((s) => s.row))].sort();
  const maxCol = seats.length > 0 ? Math.max(...seats.map((s) => s.col)) : 12;
  const priceConfig = showtimeData?.priceConfig || {};

  const totalTicketPrice = selectedSeats.reduce((sum, sn) => sum + (seatMap[sn]?.price || 0), 0);
  const totalComboPrice = combos.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const finalTotalPrice = totalTicketPrice + totalComboPrice;

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherError("");
    setVoucherLoading(true);
    try {
      const res = await axiosInstance.post("/vouchers/validate", {
        code: voucherInput.trim(),
        orderAmount: discountedPrice,
      });
      setAppliedVoucher({ code: res.data.voucher.code, discountAmount: res.data.discountAmount, type: res.data.voucher.type, value: res.data.voucher.value });
      setVoucherInput("");
    } catch (err) {
      setVoucherError(err.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setVoucherLoading(false);
    }
  };

  const isMonday = (() => {
    const vnStr = (d) => new Date(+d + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
    const s = selectedDate || (selectedShowtime?.date ? vnStr(new Date(selectedShowtime.date)) : null);
    if (!s) return new Date(+new Date() + 7 * 60 * 60 * 1000).getUTCDay() === 1;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === 1;
  })();
  const discountedPrice = isMonday ? Math.round(finalTotalPrice * 0.8) : finalTotalPrice;
  const voucherDiscount = appliedVoucher?.discountAmount || 0;
  const priceAfterVoucher = Math.max(0, discountedPrice - voucherDiscount);

  const showDate = new Date(selectedShowtime?.date || fallbackShowDate).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });

  const title = movieTitle || "Đang tải...";
  const isUrgent = timerStarted && secondsLeft <= 60;
  const isWarning = timerStarted && secondsLeft <= 120 && secondsLeft > 60;
  const timerProgress = secondsLeft / HOLD_SECONDS;
  const activeCombos = combos.filter((c) => c.quantity > 0);

  const [navigating, setNavigating] = useState(false);
  const goToPayment = () => {
    if (navigating) return;
    setNavigating(true);
    navigate("/payment", {
      state: {
        showtimeId, movieTitle: title, poster, cinemaName, showTime, showDate,
        showAddress, selectedSeats, combos, finalTotalPrice: priceAfterVoucher, roomName, duration,
        originalPrice: finalTotalPrice,
        mondayDiscount: isMonday ? finalTotalPrice - discountedPrice : 0,
        voucherDiscount,
        voucherCode: appliedVoucher?.code || null,
        voucherType: appliedVoucher?.type || null,
        voucherValue: appliedVoucher?.value || null,
        seatMap: Object.fromEntries(selectedSeats.map((sn) => [sn, { type: seatMap[sn]?.type, price: seatMap[sn]?.price }])),
      },
    });
  };

  const RING_R = 20;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 font-sans text-slate-900 dark:text-white">
      <Navbar />

      {showSeatInfo && <SeatInfoModal onClose={() => setShowSeatInfo(false)} />}

      {timerExpired && (
        <TimerExpiredModal
          onReset={() => { setTimerExpired(false); setSelectedSeats([]); setSecondsLeft(HOLD_SECONDS); setTimerStarted(false); warnedRef.current = false; }}
          onGoBack={() => navigate(-1)}
        />
      )}

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-28 pb-28 md:pb-16 animate-pageEnter">
        {/* Mobile movie info strip */}
        <div className="md:hidden mb-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 flex gap-3">
          {poster && <img src={poster} alt={title} className="w-14 h-20 object-cover rounded-lg shrink-0" />}
          <div className="min-w-0">
            <p className="font-black text-slate-900 dark:text-white text-sm line-clamp-2">{title}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-1"><MapPin size={10} className="shrink-0" />{cinemaName}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 flex items-center gap-1"><Calendar size={10} className="shrink-0" />{showDate}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10} className="shrink-0" />{showTime}</p>
          </div>
        </div>

        {/* Step bar + timer */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {["Chọn ghế", "Chọn combo"].map((label, i) => {
              const s = i + 1;
              const active = step === s;
              const done = step > s;
              return (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${active ? "bg-[#dc2626] text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-gray-500"}`}>
                      {done ? "✓" : s}
                    </div>
                    <span className={`text-sm font-bold hidden sm:inline ${active ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-500"}`}>{label}</span>
                  </div>
                  {i < 1 && <div className={`flex-1 h-0.5 max-w-[60px] transition-all ${done ? "bg-emerald-500" : "bg-slate-200 dark:bg-gray-700"}`} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Countdown timer */}
          {timerStarted && (
            <div className={`flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-2xl font-bold text-sm transition-all ${
              isUrgent ? "bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse" :
              isWarning ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-2 border-amber-300" :
              "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300"
            }`}>
              <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 -rotate-90">
                <circle cx="24" cy="24" r={RING_R} fill="none" strokeWidth="4"
                  className={isUrgent ? "stroke-red-300/50" : isWarning ? "stroke-amber-200" : "stroke-slate-200 dark:stroke-gray-600"} />
                <circle cx="24" cy="24" r={RING_R} fill="none" strokeWidth="4"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - timerProgress)}
                  strokeLinecap="round"
                  className={isUrgent ? "stroke-white transition-all duration-1000" : isWarning ? "stroke-amber-500 transition-all duration-1000" : "stroke-[#dc2626] transition-all duration-1000"} />
              </svg>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5 ${isUrgent ? "text-red-100" : "text-slate-400 dark:text-gray-400"}`}>Giữ ghế</p>
                <span className="font-black text-base leading-none">{formatTime(secondsLeft)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0 w-full">
            {/* Step 1: Seat selection */}
            {step === 1 && (
              <SeatSelector
                rows={rows}
                maxCol={maxCol}
                seatMap={seatMap}
                loadingSeats={loadingSeats}
                seatLoadError={seatLoadError}
                loadSeats={loadSeats}
                selectedSeats={selectedSeats}
                justSelected={justSelected}
                gapError={gapError}
                handleSeatClick={handleSeatClick}
                handleCoupleSeatClick={handleCoupleSeatClick}
                seatOuterRef={seatOuterRef}
                seatInnerRef={seatInnerRef}
                seatScale={seatScale}
                priceConfig={priceConfig}
                onShowInfo={() => setShowSeatInfo(true)}
              />
            )}

            {/* Step 2: Combo selection */}
            {step === 2 && (
              <div className="space-y-4">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white font-bold text-sm transition-colors">
                  <ChevronLeft size={18} /> Quay lại chọn ghế
                </button>
                <ComboSelector
                  combos={combos}
                  updateCombo={updateCombo}
                  voucherInput={voucherInput}
                  setVoucherInput={setVoucherInput}
                  appliedVoucher={appliedVoucher}
                  setAppliedVoucher={setAppliedVoucher}
                  voucherError={voucherError}
                  setVoucherError={setVoucherError}
                  voucherLoading={voucherLoading}
                  handleApplyVoucher={handleApplyVoucher}
                />
              </div>
            )}
          </div>

          {/* Desktop summary panel */}
          <div className="hidden md:block w-full md:w-[300px] lg:w-[400px] shrink-0 sticky top-28">
            <BookingSummaryPanel
              title={title}
              cinemaName={cinemaName}
              showAddress={showAddress}
              showDate={showDate}
              showTime={showTime}
              selectedSeats={selectedSeats}
              totalTicketPrice={totalTicketPrice}
              activeCombos={activeCombos}
              isMonday={isMonday}
              finalTotalPrice={finalTotalPrice}
              discountedPrice={discountedPrice}
              voucherDiscount={voucherDiscount}
              appliedVoucher={appliedVoucher}
              priceAfterVoucher={priceAfterVoucher}
              step={step}
              setStep={setStep}
              goToPayment={goToPayment}
              navigating={navigating}
            />
          </div>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {selectedSeats.length > 0 ? (
            <>
              <p className="text-white font-black text-lg leading-none">{priceAfterVoucher.toLocaleString()} ₫</p>
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
