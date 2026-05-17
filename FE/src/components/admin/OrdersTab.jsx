import React, { useState, useRef, useEffect } from "react";
import {
  Ticket,
  X,
  User,
  Printer,
  Eye,
  Crown,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";

const TICKET_STATUS_BADGE = {
  not_printed: { label: "CHƯA IN", color: "bg-orange-50 text-orange-600 border-orange-200" },
  printed: { label: "ĐÃ IN", color: "bg-teal-50 text-teal-600 border-teal-200" },
};

export const OrderDetailModal = ({ order, onClose, onPrint }) => {
  if (!order) return null;
  const isPaid = order.status === "Đã thanh toán";
  const ticketBadge = TICKET_STATUS_BADGE[order.ticketStatus] || TICKET_STATUS_BADGE.not_printed;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <style type="text/css" media="print">
        {`
          @page { size: 80mm 145mm; margin: 0; }
          html, body { width: 80mm !important; height: 145mm !important; margin: 0 !important; padding: 0 !important; background: white !important; overflow: hidden !important; }
          body * { visibility: hidden !important; }
          #print-ticket, #print-ticket * { visibility: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          #print-ticket { position: fixed !important; top: 0 !important; left: 0 !important; width: 80mm !important; height: 144mm !important; padding: 4mm !important; margin: 0 !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; display: flex !important; flex-direction: column !important; justify-content: space-between !important; z-index: 999999 !important; transform: none !important; }
        `}
      </style>

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
                <p className="text-slate-500">Trạng thái đơn:</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"} border`}>
                  {order.status}
                </span>
              </div>
              {isPaid && (
                <div>
                  <p className="text-slate-500">Trạng thái vé:</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${ticketBadge.color}`}>
                    {ticketBadge.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            id="print-ticket"
            className="bg-white mx-auto w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden font-sans text-gray-900 border border-gray-200 relative print:border-none print:shadow-none"
          >
            <div className="bg-slate-900 p-5 pb-5 relative overflow-hidden print:bg-black print:text-white shrink-0">
              <div className="absolute -right-10 -top-10 opacity-10 print:opacity-30">
                <Crown size={120} className="text-[#d4af37] print:text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Crown
                    size={14}
                    className="text-[#d4af37] print:text-white"
                  />
                  <p className="text-[#d4af37] text-[9px] font-bold tracking-[0.3em] uppercase print:text-white">
                    V.I.P Admission
                  </p>
                </div>
                <h2 className="text-[20px] font-black text-white leading-tight uppercase tracking-wide">
                  {order.movieTitle}
                </h2>
                <div className="mt-2 inline-block px-2 py-1 border border-[#d4af37]/30 bg-[#d4af37]/10 rounded text-[#d4af37] text-[9px] font-bold tracking-widest uppercase print:border-white print:text-white print:bg-transparent">
                  2D Subtitle
                </div>
              </div>
            </div>

            <div className="p-4 pb-2 space-y-4 bg-white flex-1 relative print:border-x-2 print:border-black">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none print:hidden"
                style={{
                  backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                  backgroundSize: "12px 12px",
                }}
              ></div>
              <div className="relative z-10 space-y-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg print:border-gray-400 print:bg-transparent print:p-1 print:border-0">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5 print:text-gray-600">
                    Cinema
                  </p>
                  <p className="text-[14px] font-extrabold text-slate-900 leading-tight uppercase print:text-black">
                    {order.cinemaName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg print:border-gray-400 print:bg-transparent print:p-1 print:border-0">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5 print:text-gray-600">
                      Date
                    </p>
                    <p className="text-[13px] font-extrabold text-slate-900 print:text-black">
                      {order.showDate}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right print:border-gray-400 print:bg-transparent print:p-1 print:border-0">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5 print:text-gray-600">
                      Time
                    </p>
                    <p className="text-[13px] font-extrabold text-slate-900 print:text-black">
                      {order.showTime}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg print:border-gray-400 print:bg-transparent print:border-y-2 print:border-x-0 print:rounded-none print:py-2">
                  <p className="text-[9px] text-[#dc2626] font-bold uppercase tracking-[0.2em] mb-0.5 print:text-black">
                    Seat(s)
                  </p>
                  <p className="text-[22px] font-black text-[#dc2626] tracking-tighter leading-none print:text-black">
                    {order.selectedSeats?.join(", ")}
                  </p>
                </div>
              </div>

              {order.combos?.length > 0 && (
                <div className="p-3 bg-[#fffaf0] border border-[#f3e3b7] rounded-lg print:border-gray-400 print:bg-transparent print:border-y-2 print:border-x-0 print:rounded-none print:py-2">
                  <p className="text-[9px] text-[#b8860b] font-bold uppercase tracking-[0.2em] mb-2 print:text-black">
                    F&amp;B / Combo
                  </p>
                  <div className="space-y-1.5">
                    {order.combos.map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-[13px] font-semibold text-slate-800 print:text-black">
                          {item.name} <span className="text-[#b8860b] print:text-black">×{item.quantity}</span>
                        </span>
                        <span className="text-[13px] font-bold text-slate-800 print:text-black">
                          {(item.price * item.quantity).toLocaleString()}đ
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 flex flex-col items-center justify-center shrink-0 print:mt-1 print:pt-1">
                <div className="flex gap-4 items-center w-full px-2 justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${order.orderId}`}
                    alt="QR Code"
                    className="w-[60px] h-[60px] mix-blend-multiply shrink-0"
                  />
                  <div className="flex flex-col justify-center items-center">
                    <div className="h-6 flex gap-[2px] opacity-80 justify-center w-full print:opacity-100">
                      {[2, 4, 1, 3, 2, 1, 1, 3, 4, 2, 1, 2, 3, 1, 1].map(
                        (w, i) => (
                          <div
                            key={i}
                            className="bg-slate-900 h-full print:bg-black"
                            style={{ width: `${w}px` }}
                          ></div>
                        ),
                      )}
                    </div>
                    <p className="font-mono font-bold text-slate-600 text-[10px] mt-1.5 tracking-widest uppercase print:text-black">
                      {order.orderId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 relative shrink-0 print:bg-white print:border-x-2 print:border-b-2 print:border-black">
              <div className="hidden print:block absolute top-0 left-0 w-full border-t-2 border-dashed border-black -mt-[2px]"></div>
              <div className="absolute top-0 left-0 w-full h-[6px] bg-[radial-gradient(circle,transparent_3px,#0f172a_3px)] bg-[length:14px_12px] -mt-[6px] print:hidden"></div>

              <div className="p-4 flex justify-between items-end">
                <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest print:text-black">
                  Total Paid
                </span>
                <span className="text-[18px] font-black text-white print:text-black">
                  {order.finalTotalPrice?.toLocaleString()} ₫
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 print:hidden">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold transition-all text-sm">
            Đóng
          </button>
          {isPaid ? (
            <>
              {order.ticketStatus !== "printed" && (
                <button
                  onClick={() => { onPrint?.(order.bookingRawId); onClose(); }}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-all text-sm flex items-center gap-2"
                >
                  <CheckCircle size={16} /> Đánh dấu đã in
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all text-sm flex items-center gap-2"
              >
                <Printer size={18} /> In vé cứng
              </button>
            </>
          ) : (
            <button disabled className="px-6 py-2.5 bg-gray-200 text-gray-500 rounded-xl font-bold cursor-not-allowed text-sm flex items-center gap-2">
              <Printer size={18} /> Chưa thanh toán
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const OrdersManager = ({ orders = [], loading = false, onViewTicket, onConfirm, onPrint }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilter(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterOptions = [
    { value: "", label: "Tất cả" },
    { value: "Đã thanh toán", label: "Đã thanh toán" },
    { value: "Chờ thanh toán", label: "Chờ thanh toán" },
  ];

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.orderId?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.movieTitle?.toLowerCase().includes(q) ||
      o.phone?.includes(q);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Đơn hàng</h2>
          <p className="text-sm text-slate-500">Kiểm tra và in vé cho khách</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm mã vé, khách hàng, phim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`px-3.5 py-2.5 border rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm ${
                filterStatus ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">{filterStatus || "Lọc"}</span>
              {filterStatus && (
                <span onClick={(e) => { e.stopPropagation(); setFilterStatus(""); }} className="hover:text-red-800">
                  <X size={13} />
                </span>
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterStatus(opt.value); setShowFilter(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                      filterStatus === opt.value ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mx-auto"></div>
          </div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4 pl-6">Mã vé</th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Phim / Suất chiếu</th>
              <th className="p-4">Tổng tiền</th>
              <th className="p-4 text-center">Trạng thái đơn</th>
              <th className="p-4 text-center">Trạng thái vé</th>
              <th className="p-4 text-right pr-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr><td colSpan="6" className="p-12 text-center text-slate-400 italic">
                {search || filterStatus ? "Không tìm thấy đơn hàng phù hợp." : "Chưa có đơn hàng nào."}
              </td></tr>
            ) : filteredOrders.map((order, index) => (
              <tr
                key={`${order.orderId}-${index}`}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="p-4 pl-6 font-mono font-bold text-slate-700">
                  {order.orderId}
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-800">
                    {order.customerName}
                  </div>
                  <div className="text-xs text-slate-500">{order.phone}</div>
                </td>
                <td className="p-4">
                  <div className="font-bold text-slate-700">
                    {order.movieTitle}
                  </div>
                  <div className="text-xs text-slate-500">
                    {order.showDate} - {order.showTime}
                  </div>
                </td>
                <td className="p-4 font-bold text-[#dc2626]">
                  {order.finalTotalPrice?.toLocaleString()} đ
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    order.status === "Đã thanh toán" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                    order.status === "Đã hoàn tiền" ? "bg-blue-50 text-blue-600 border-blue-200" :
                    order.status === "Đã hủy" ? "bg-red-50 text-red-500 border-red-200" :
                    order.status === "Hết hạn" ? "bg-slate-100 text-slate-500 border-slate-200" :
                    "bg-amber-50 text-amber-600 border-amber-200"
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {order.status === "Đã thanh toán" ? (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      order.ticketStatus === "printed"
                        ? "bg-teal-50 text-teal-600 border-teal-200"
                        : "bg-orange-50 text-orange-600 border-orange-200"
                    }`}>
                      {order.ticketStatus === "printed" ? "ĐÃ IN" : "CHƯA IN"}
                    </span>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {order.status === "Chờ thanh toán" && order.paymentMethod === "cash" && (
                      <button
                        onClick={() => onConfirm(order.bookingRawId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                      >
                        <CheckCircle size={14} /> Xác nhận
                      </button>
                    )}
                    {order.status === "Đã thanh toán" && order.ticketStatus !== "printed" && (
                      <button
                        onClick={() => onPrint?.(order.bookingRawId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition-colors border border-teal-200"
                        title="Đánh dấu vé đã in"
                      >
                        <Printer size={14} /> In vé
                      </button>
                    )}
                    <button
                      onClick={() => onViewTicket(order)}
                      className="p-2 text-slate-400 hover:text-[#dc2626] hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};
