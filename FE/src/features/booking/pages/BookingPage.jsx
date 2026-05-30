import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/shared/components/common/Navbar";
import Footer from "@/shared/components/common/Footer";
import { Calendar, MapPin, CreditCard, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import SeatSelector from "@/features/booking/components/SeatSelector";
import ComboSelector from "@/features/booking/components/ComboSelector";
import BookingSummaryPanel from "@/features/booking/components/BookingSummaryPanel";
import { SeatInfoModal, TimerExpiredModal } from "@/features/booking/components/BookingModals";
import { useBookingState } from "@/features/booking/hooks/use-booking-state";

const BookingPage = () => {
  const navigate = useNavigate();
  const bk = useBookingState();

  const RING_R = 20;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 font-sans text-slate-900 dark:text-white">
      <Navbar />

      {bk.showSeatInfo && <SeatInfoModal onClose={() => bk.setShowSeatInfo(false)} />}

      {bk.timerExpired && (
        <TimerExpiredModal
          onReset={bk.resetTimer}
          onGoBack={() => navigate(-1)}
        />
      )}

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-28 pb-28 md:pb-16 animate-pageEnter">

        {/* Mobile movie info strip */}
        <div className="md:hidden mb-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 flex gap-3">
          {bk.poster && <img src={bk.poster} alt={bk.title} className="w-14 h-20 object-cover rounded-lg shrink-0" />}
          <div className="min-w-0">
            <p className="font-black text-slate-900 dark:text-white text-sm line-clamp-2">{bk.title}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 flex items-center gap-1"><MapPin size={10} className="shrink-0" />{bk.cinemaName}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 flex items-center gap-1"><Calendar size={10} className="shrink-0" />{bk.showDate}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 flex items-center gap-1"><Clock size={10} className="shrink-0" />{bk.showTime}</p>
          </div>
        </div>

        {/* Step bar + countdown timer */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            {["Chọn ghế", "Chọn combo"].map((label, i) => {
              const s = i + 1;
              const active = bk.step === s;
              const done = bk.step > s;
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

          {bk.timerStarted && (
            <div className={`flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-2xl font-bold text-sm transition-all ${
              bk.isUrgent  ? "bg-red-600 text-white shadow-lg shadow-red-200 animate-pulse" :
              bk.isWarning ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-2 border-amber-300" :
                             "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300"
            }`}>
              <svg width="40" height="40" viewBox="0 0 48 48" className="shrink-0 -rotate-90">
                <circle cx="24" cy="24" r={RING_R} fill="none" strokeWidth="4"
                  className={bk.isUrgent ? "stroke-red-300/50" : bk.isWarning ? "stroke-amber-200" : "stroke-slate-200 dark:stroke-gray-600"} />
                <circle cx="24" cy="24" r={RING_R} fill="none" strokeWidth="4"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - bk.timerProgress)}
                  strokeLinecap="round"
                  className={bk.isUrgent ? "stroke-white transition-all duration-1000" : bk.isWarning ? "stroke-amber-500 transition-all duration-1000" : "stroke-[#dc2626] transition-all duration-1000"} />
              </svg>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5 ${bk.isUrgent ? "text-red-100" : "text-slate-400 dark:text-gray-400"}`}>Giữ ghế</p>
                <span className="font-black text-base leading-none">{bk.formatTime(bk.secondsLeft)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0 w-full">

            {/* Step 1: Seat grid */}
            {bk.step === 1 && (
              <SeatSelector
                rows={bk.rows}
                maxCol={bk.maxCol}
                seatMap={bk.seatMap}
                loadingSeats={bk.loadingSeats}
                seatLoadError={bk.seatLoadError}
                loadSeats={bk.loadSeats}
                selectedSeats={bk.selectedSeats}
                justSelected={bk.justSelected}
                gapError={bk.gapError}
                handleSeatClick={bk.handleSeatClick}
                handleCoupleSeatClick={bk.handleCoupleSeatClick}
                seatOuterRef={bk.seatOuterRef}
                seatInnerRef={bk.seatInnerRef}
                seatScale={bk.seatScale}
                priceConfig={bk.priceConfig}
                onShowInfo={() => bk.setShowSeatInfo(true)}
              />
            )}

            {/* Step 2: Combo + voucher */}
            {bk.step === 2 && (
              <div className="space-y-4">
                <button onClick={() => bk.setStep(1)} className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white font-bold text-sm transition-colors">
                  <ChevronLeft size={18} /> Quay lại chọn ghế
                </button>
                <ComboSelector
                  combos={bk.combos}
                  updateCombo={bk.updateCombo}
                  voucherInput={bk.voucherInput}
                  setVoucherInput={bk.setVoucherInput}
                  appliedVoucher={bk.appliedVoucher}
                  setAppliedVoucher={bk.setAppliedVoucher}
                  voucherError={bk.voucherError}
                  setVoucherError={bk.setVoucherError}
                  voucherLoading={bk.voucherLoading}
                  handleApplyVoucher={bk.handleApplyVoucher}
                />
              </div>
            )}
          </div>

          {/* Desktop summary panel */}
          <div className="hidden md:block w-full md:w-[300px] lg:w-[400px] shrink-0 sticky top-28">
            <BookingSummaryPanel
              title={bk.title}
              cinemaName={bk.cinemaName}
              showAddress={bk.showAddress}
              showDate={bk.showDate}
              showTime={bk.showTime}
              selectedSeats={bk.selectedSeats}
              totalTicketPrice={bk.totalTicketPrice}
              activeCombos={bk.activeCombos}
              isMonday={bk.isMonday}
              finalTotalPrice={bk.finalTotalPrice}
              discountedPrice={bk.discountedPrice}
              voucherDiscount={bk.voucherDiscount}
              appliedVoucher={bk.appliedVoucher}
              priceAfterVoucher={bk.priceAfterVoucher}
              step={bk.step}
              setStep={bk.setStep}
              goToPayment={bk.goToPayment}
              navigating={bk.navigating}
            />
          </div>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {bk.selectedSeats.length > 0 ? (
            <>
              <p className="text-white font-black text-lg leading-none">{bk.priceAfterVoucher.toLocaleString()} ₫</p>
              <p className="text-slate-400 text-xs mt-0.5 truncate">{bk.selectedSeats.length} ghế · {bk.selectedSeats.join(", ")}</p>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Chọn ghế để tiếp tục</p>
          )}
        </div>
        {bk.step === 1 ? (
          <button
            disabled={bk.selectedSeats.length === 0}
            onClick={() => bk.setStep(2)}
            className={`shrink-0 font-black px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all ${bk.selectedSeats.length === 0 ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-[#dc2626] text-white"}`}
          >
            Tiếp tục <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={bk.goToPayment} className="shrink-0 font-black px-5 py-2.5 rounded-xl text-sm bg-[#dc2626] text-white flex items-center gap-2">
            <CreditCard size={16} /> Thanh toán
          </button>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BookingPage;
