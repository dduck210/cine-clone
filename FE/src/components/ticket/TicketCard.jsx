import React from "react";
import { QRCodeSVG } from "qrcode.react";

const WATERMARK = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='100'%3E%3Ctext x='0' y='60' font-family='monospace' font-size='14' font-weight='900' letter-spacing='2' fill='%23000' opacity='0.20' transform='rotate(-28 90 50)'%3E5CINE%20TICKET%3C/text%3E%3C/svg%3E")`;

const formatDate = (d) => {
  if (!d) return "---";
  // Strip time part if it's a plain date string like "2026-05-23" or ISO "2026-05-23T..."
  const datePart = typeof d === "string" ? d.split("T")[0] : d;
  const date = new Date(datePart);
  return isNaN(date.getTime()) ? String(datePart) : date.toLocaleDateString("vi-VN");
};

const TicketCard = ({ bookingCode, movieTitle, cinemaName, roomName, showDate, showTime, seats, totalPrice, combos }) => {
  const seatText = Array.isArray(seats) ? seats.join(", ") : seats;
  const validCombos = (combos || []).filter(c => c.quantity > 0);
  const displayDate = formatDate(showDate);

  return (
    <div
      className="mx-auto w-full max-w-[360px] rounded-xl shadow-2xl overflow-hidden font-mono"
      style={{ border: "1px solid #e5e0d5", backgroundColor: "#fdf8f0", backgroundImage: WATERMARK, backgroundSize: "180px 100px" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-dashed border-gray-300 text-center">
        <p className="text-[13px] font-black tracking-[0.3em] text-gray-700 uppercase">
          THẺ VÀO PHÒNG CHIẾU PHIM
        </p>
      </div>

      {/* Cinema info */}
      <div className="relative z-10 px-5 py-4 border-b border-dashed border-gray-300 space-y-0.5">
        <p className="font-black text-[14px] text-gray-900 uppercase">{cinemaName}</p>
        {roomName && <p className="text-[11px] font-bold text-gray-500 uppercase">{roomName}</p>}
        <p className="text-[10px] text-gray-400 pt-1">Mã ĐH: {bookingCode}</p>
        <p className="text-[10px] text-gray-400">{displayDate} — {showTime}</p>
      </div>

      {/* Tear line */}
      <div className="relative z-10 h-5 flex items-center">
        <div className="absolute -left-3 w-6 h-6 rounded-full bg-gray-100 shadow-inner" style={{ border: "1px solid #e5e0d5" }} />
        <div className="absolute -right-3 w-6 h-6 rounded-full bg-gray-100 shadow-inner" style={{ border: "1px solid #e5e0d5" }} />
        <div className="w-full mx-4 border-t-2 border-dashed border-gray-300" />
      </div>

      {/* Movie + 2×2 grid */}
      <div className="relative z-10 px-5 pt-3 pb-4">
        <p className="text-[18px] font-black text-gray-900 uppercase leading-tight mb-3">{movieTitle}</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[11px]">
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Suất chiếu</p>
            <p className="font-black text-gray-800">{showTime}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Ngày chiếu</p>
            <p className="font-black text-gray-800">{displayDate}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Phòng</p>
            <p className="font-black text-gray-800 uppercase">{roomName || "---"}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Ghế</p>
            <p className="font-black text-[#dc2626] text-[16px] leading-none">{seatText}</p>
          </div>
        </div>
      </div>

      {/* Combos */}
      {validCombos.length > 0 && (
        <div className="relative z-10 px-5 pb-4 border-t border-dashed border-gray-300 pt-3">
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-1.5">Combo bỏng nước</p>
          {validCombos.map((c, i) => (
            <p key={i} className="font-black text-gray-800 text-[11px]">{c.quantity}× {c.name}</p>
          ))}
        </div>
      )}

      {/* QR */}
      <div className="relative z-10 border-t-2 border-dashed border-gray-300 px-5 py-4 flex flex-col items-center gap-2">
        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Quét mã để xác thực vé</p>
        <QRCodeSVG value={bookingCode} size={100} bgColor="transparent" fgColor="#111827" level="M" />
        <p className="font-mono font-bold text-gray-600 text-[11px] tracking-[0.28em] uppercase">{bookingCode}</p>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-5 py-3 flex justify-between items-center bg-gray-900">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Paid</span>
        <span className="font-mono font-black text-white text-[18px]">{Number(totalPrice || 0).toLocaleString()} đ</span>
      </div>
    </div>
  );
};

export default TicketCard;
