import React from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Ticket, X, User, Printer, CheckCircle,
} from "lucide-react";

const TICKET_STATUS_BADGE = {
  not_printed: { label: "CHƯA IN", color: "bg-orange-50 text-orange-600 border-orange-200" },
  printed:     { label: "ĐÃ IN",   color: "bg-teal-50 text-teal-600 border-teal-200" },
};

/**
 * OrderDetailModal — full-screen modal showing booking detail + printable ticket.
 * @param {{ order: object|null, onClose: () => void, onPrint: (bookingRawId: string) => void }} props
 */
const OrderDetailModal = ({ order, onClose, onPrint }) => {
  if (!order) return null;
  const isPaid = order.status === "Đã thanh toán";
  const ticketBadge = TICKET_STATUS_BADGE[order.ticketStatus] || TICKET_STATUS_BADGE.not_printed;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0; }
          html, body { width: 210mm !important; height: 297mm !important; margin: 0 !important; padding: 0 !important; background: white !important; overflow: hidden !important; }
          body * { visibility: hidden !important; }
          #print-wrapper { visibility: visible !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 210mm !important; height: 297mm !important; overflow: hidden !important; display: flex !important; justify-content: center !important; align-items: flex-start !important; }
          #print-wrapper * { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          #print-ticket { width: 360px !important; max-width: none !important; flex-shrink: 0 !important; transform: scale(2.15) !important; transform-origin: top center !important; border-radius: 0 !important; box-shadow: none !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
        `}
      </style>

      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={onClose}
      />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: "modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-10 shrink-0 print:hidden">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Ticket className="text-[#dc2626]" size={20} />
            Chi tiết vé - {order.orderId}
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-white transition-all duration-150 active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-gray-900 p-6 print:p-0">
          {/* Booking info (screen only) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 border border-slate-200 dark:border-gray-700 shadow-sm print:hidden">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 border-b border-slate-100 dark:border-gray-700 pb-2 flex items-center gap-2">
              <User size={18} className="text-slate-400 dark:text-gray-400" /> Thông tin người đặt
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-gray-400">Khách hàng:</p>
                <p className="font-bold text-slate-800 dark:text-white">{order.customerName}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-gray-400">Số điện thoại:</p>
                <p className="font-bold text-slate-800 dark:text-white">{order.phone}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-gray-400">Email:</p>
                <p className="font-bold text-slate-800 dark:text-white break-all">{order.customerEmail || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-gray-400">Thời gian giao dịch:</p>
                <p className="font-semibold text-slate-700 dark:text-gray-300">{order.bookingTime}</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-gray-400">Trạng thái đơn:</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"} border`}>
                  {order.status}
                </span>
              </div>
              {isPaid && (
                <div>
                  <p className="text-slate-500 dark:text-gray-400">Trạng thái vé:</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${ticketBadge.color}`}>
                    {ticketBadge.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Printable ticket */}
          <div id="print-wrapper">
            <div
              id="print-ticket"
              className="mx-auto w-full max-w-[360px] rounded-xl shadow-2xl overflow-hidden font-mono text-gray-900 print:shadow-none print:rounded-none"
              style={{
                border: "1px solid rgb(229,224,213)",
                backgroundColor: "rgb(253,248,240)",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='100'%3E%3Ctext x='0' y='60' font-family='monospace' font-size='14' font-weight='900' letter-spacing='2' fill='%23000' opacity='0.20' transform='rotate(-28 90 50)'%3E5CINE%20TICKET%3C/text%3E%3C/svg%3E")`,
                backgroundSize: "180px 100px",
              }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-dashed border-gray-300 text-center">
                <p className="text-[13px] font-black tracking-[0.3em] text-gray-700 uppercase">THẺ VÀO PHÒNG CHIẾU PHIM</p>
              </div>

              {/* Cinema info */}
              <div className="relative z-10 px-5 py-4 border-b border-dashed border-gray-300 space-y-0.5">
                <p className="font-black text-[14px] text-gray-900 uppercase">{order.cinemaName}</p>
                {order._raw?.showtime?.room?.name && (
                  <p className="text-[11px] font-bold text-gray-500 uppercase">{order._raw.showtime.room.name}</p>
                )}
                <p className="text-[10px] text-gray-400 pt-1">Mã ĐH: {order.orderId}</p>
                <p className="text-[10px] text-gray-400">{order.showDate} — {order.showTime}</p>
              </div>

              {/* Torn-edge divider */}
              <div className="relative z-10 h-5 flex items-center">
                <div className="absolute -left-3 w-6 h-6 rounded-full bg-gray-100 shadow-inner" style={{ border: "1px solid rgb(229,224,213)" }} />
                <div className="absolute -right-3 w-6 h-6 rounded-full bg-gray-100 shadow-inner" style={{ border: "1px solid rgb(229,224,213)" }} />
                <div className="w-full mx-4 border-t-2 border-dashed border-gray-300" />
              </div>

              {/* Movie + details */}
              <div className="relative z-10 px-5 pt-3 pb-4">
                <p className="text-[18px] font-black text-gray-900 uppercase leading-tight mb-3">{order.movieTitle}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[11px]">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Suất chiếu</p>
                    <p className="font-black text-gray-800">{order.showTime}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Ngày chiếu</p>
                    <p className="font-black text-gray-800">{order.showDate}</p>
                  </div>
                  {order._raw?.showtime?.room?.name && (
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Phòng</p>
                      <p className="font-black text-gray-800 uppercase">{order._raw.showtime.room.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Ghế</p>
                    <p className="font-black text-[#dc2626] text-[16px] leading-none">{order.selectedSeats?.join(", ")}</p>
                  </div>
                </div>

                {order.combos?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-1.5">
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-1">F&amp;B / Combo</p>
                    {order.combos.map((item, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="text-gray-600">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                        <span className="font-black text-gray-800">{(item.price * item.quantity).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="relative z-10 border-t-2 border-dashed border-gray-300 px-5 py-4 flex flex-col items-center gap-2">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Quét mã để xác thực vé</p>
                <QRCodeSVG
                  value={order.orderId}
                  size={90}
                  bgColor="transparent"
                  fgColor="#111827"
                  level="M"
                />
                <p className="font-mono font-bold text-gray-600 text-[11px] tracking-[0.28em] uppercase">{order.orderId}</p>
              </div>

              {/* Footer */}
              <div className="relative z-10 px-5 py-3 flex justify-between items-center bg-gray-900">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Paid</span>
                <span className="font-mono font-black text-white text-[18px]">{order.finalTotalPrice?.toLocaleString()} ₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700/50 rounded-xl font-semibold transition-all duration-150 active:scale-95 text-sm"
          >
            Đóng
          </button>
          {isPaid ? (
            <>
              {order.ticketStatus !== "printed" && (
                <button
                  onClick={() => { onPrint?.(order.bookingRawId); onClose(); }}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-all duration-150 active:scale-95 text-sm flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Đánh dấu đã in
                </button>
              )}
            </>
          ) : (
            <button
              disabled
              className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-bold cursor-not-allowed text-sm flex items-center gap-2"
            >
              <Printer size={18} /> Chưa thanh toán
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
