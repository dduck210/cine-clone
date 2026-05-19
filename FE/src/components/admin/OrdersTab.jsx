import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Ticket,
  X,
  User,
  Printer,
  Eye,
  CheckCircle,
  Search,
  Filter,
  ScanLine,
  Camera,
} from "lucide-react";

// ── QR Scanner Modal (uses webcam) ────────────────────────────────
const QrScannerModal = ({ onScanned, onClose }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-scanner-container",
      { fps: 10, qrbox: { width: 240, height: 240 }, rememberLastUsedCamera: true },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      (text) => {
        scanner.clear().catch(() => {});
        onScanned(text.trim());
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[#dc2626]" />
            <h3 className="font-bold text-slate-800">Quét mã QR vé</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 text-center mb-3">Hướng camera vào mã QR trên điện thoại khách</p>
          <div id="qr-scanner-container" className="w-full rounded-xl overflow-hidden" />
        </div>
      </div>
    </div>
  );
};

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
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const filterRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilter(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-open modal when a full booking code is scanned/typed
  useEffect(() => {
    const trimmed = search.trim();
    if (!/^BK\d{10,}$/i.test(trimmed)) return;
    const found = orders.find((o) => o.orderId?.toLowerCase() === trimmed.toLowerCase());
    if (found) {
      onViewTicket(found);
      setSearch("");
      setScanning(false);
    }
  }, [search, orders]);

  const handleScanClick = () => {
    setShowScanner(true);
    setScanning(true);
    setSearch("");
  };

  const handleScanned = (code) => {
    setShowScanner(false);
    setSearch(code);
  };

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
          <button
            onClick={handleScanClick}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-sm shrink-0 ${
              scanning
                ? "bg-[#dc2626] text-white border-[#dc2626] animate-pulse"
                : "bg-white border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-[#dc2626]"
            }`}
            title="Quét mã vé bằng máy quét barcode"
          >
            <ScanLine size={16} />
            <span className="hidden sm:inline">{scanning ? "Đang chờ quét..." : "Quét vé"}</span>
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              ref={searchRef}
              type="text"
              placeholder={scanning ? "Dí máy quét vào QR code..." : "Tìm mã vé, khách hàng, phim..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => { if (scanning && !search) setScanning(false); }}
              className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                scanning
                  ? "border-[#dc2626] focus:ring-red-200 bg-red-50"
                  : "border-slate-200 focus:border-[#dc2626] focus:ring-red-100"
              }`}
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

      {showScanner && (
        <QrScannerModal
          onScanned={handleScanned}
          onClose={() => { setShowScanner(false); setScanning(false); }}
        />
      )}
    </div>
  );
};
