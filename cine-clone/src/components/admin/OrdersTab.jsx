export const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;
  const isPaid = order.status === "Đã thanh toán";
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0 print:hidden">
          <div>
            <h3 className="font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
              <Ticket className="text-[#dc2626]" size={20} />
              Chi tiết vé - {order.orderId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-50 p-6 print:p-0">
          <div className="bg-white rounded-2xl p-5 mb-8 border border-slate-200 shadow-sm print:hidden">
            <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2">
              <User size={18} className="text-slate-400" /> Thông tin người đặt
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Khách hàng:</p>
                <p className="font-bold text-slate-800">{order.customerName}</p>
              </div>
              <div>
                <p className="text-slate-500">Số điện thoại:</p>
                <p className="font-bold text-slate-800">{order.phone}</p>
              </div>
              <div>
                <p className="text-slate-500">Thời gian giao dịch:</p>
                <p className="font-semibold text-slate-700">
                  {order.bookingTime}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Trạng thái:</p>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"} border`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          <div
            id="print-ticket"
            className="bg-white mx-auto w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden font-sans text-gray-900 border border-gray-200 relative print:border-none print:shadow-none"
          >
            <div className="bg-[#121826] p-5 pb-5 relative overflow-hidden print:bg-[#121826] print:text-white shrink-0">
              <div className="absolute -right-6 -top-6 opacity-10 print:opacity-20">
                <Ticket
                  size={100}
                  className="text-[#d4af37] rotate-12 print:text-white"
                />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Crown
                    size={14}
                    className="text-[#d4af37] print:text-white"
                  />
                  <p className="text-[#d4af37] text-[10px] font-bold tracking-[0.3em] uppercase print:text-white">
                    V.I.P Admission
                  </p>
                </div>
                <h2 className="text-[20px] font-black text-white leading-tight uppercase tracking-wide">
                  {order.movieTitle}
                </h2>
                <div className="mt-2 inline-block px-2 py-0.5 bg-[#d4af37] text-slate-900 text-[9px] font-black tracking-widest uppercase rounded-sm print:bg-white print:text-black">
                  2D Subtitle
                </div>
              </div>
            </div>

            <div className="p-4 relative bg-white flex-1 flex flex-col print:bg-white print:border-x-2 print:border-black print:p-2">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none print:hidden"
                style={{
                  backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                  backgroundSize: "12px 12px",
                }}
              ></div>
              <div className="relative z-10 space-y-2 flex-1">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg print:border-gray-400 print:bg-transparent">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5 print:text-gray-600">
                    Cinema
                  </p>
                  <p className="text-[14px] font-extrabold text-slate-900 leading-tight uppercase print:text-black">
                    {order.cinemaName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg print:border-gray-400 print:bg-transparent">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5 print:text-gray-600">
                      Date
                    </p>
                    <p className="text-[12px] font-extrabold text-slate-900 print:text-black">
                      {order.showDate}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg print:border-gray-400 print:bg-transparent">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5 print:text-gray-600">
                      Time
                    </p>
                    <p className="text-[12px] font-extrabold text-slate-900 print:text-black">
                      {order.showTime}
                    </p>
                  </div>
                </div>

                {/* THÊM BOX SỐ GHẾ */}
                <div className="p-3 bg-[#fffaf0] border border-[#f3e3b7] rounded-lg flex justify-between items-center print:border-gray-400 print:bg-transparent print:border-2">
                  <div>
                    <p className="text-[9px] text-[#b8860b] font-bold uppercase tracking-[0.2em] mb-0.5 print:text-black">
                      Seat(s)
                    </p>
                    <p className="text-[24px] font-black text-slate-900 tracking-tighter leading-none print:text-black">
                      {order.selectedSeats?.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-[#b8860b] font-bold uppercase tracking-[0.2em] mb-0.5 print:text-black">
                      Room
                    </p>
                    <p className="text-[24px] font-black text-slate-900 tracking-tighter leading-none print:text-black">
                      03
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
