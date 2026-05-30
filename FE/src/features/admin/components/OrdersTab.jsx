import React, { useState, useRef, useEffect } from "react";
import usePagination from "@/shared/hooks/use-pagination";
import { Html5QrcodeScanner } from "html5-qrcode";
import toast from "react-hot-toast";
import {
  X,
  Eye,
  CheckCircle,
  Search,
  Mail,
  ScanLine,
  Camera,
} from "lucide-react";
import OrderDetailModal from "@/features/admin/components/OrderDetailModal";

// Re-export for backward compat with Dashboard.jsx named import
export { default as OrderDetailModal } from "@/features/admin/components/OrderDetailModal";

// ── QR Scanner Modal (uses webcam) — renders Html5QrcodeScanner in a portal-like overlay
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
        scanner.clear().catch(() => { });
        onScanned(text.trim());
      },
      () => { }
    );

    return () => {
      scanner.clear().catch(() => { });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[#dc2626]" />
            <h3 className="font-bold text-slate-800 dark:text-white">Quét mã QR vé</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-400 dark:text-gray-400 transition-all duration-150 active:scale-90">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-gray-400 text-center mb-3">Hướng camera vào mã QR trên điện thoại khách</p>
          <div id="qr-scanner-container" className="w-full rounded-xl overflow-hidden" />
        </div>
      </div>
    </div>
  );
};

const PAGE_SIZE = 6;

export const OrdersManager = ({ orders = [], loading = false, onViewTicket, onConfirm, onPrint }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const { currentPage, totalPages, setTotalPages, paginationItems, goToPage, reset: resetPage } = usePagination();
  const searchRef = useRef(null);

  const autoPrintByCode = (code) => {
    const trimmed = code.trim();
    const found = orders.find((o) => o.orderId?.toLowerCase() === trimmed.toLowerCase());
    if (!found) { toast.error(`Không tìm thấy đơn hàng: ${trimmed}`); return; }
    if (found.status !== "Đã thanh toán") { toast.error("Đơn hàng này chưa được thanh toán"); return; }
    if (found.ticketStatus === "printed") {
      toast("Vé này đã được xác nhận trước đó", { icon: "ℹ️" });
      onViewTicket?.(found);
      return;
    }
    // Optimistically update local state so modal shows "ĐÃ IN" immediately
    found.ticketStatus = "printed";
    onViewTicket?.(found);
    onPrint?.(found.bookingRawId);
  };

  // Auto-print when a full booking code is typed via keyboard wedge scanner
  useEffect(() => {
    const trimmed = search.trim();
    if (!/^BK\d{10,}$/i.test(trimmed)) return;
    setSearch("");
    setScanning(false);
    autoPrintByCode(trimmed);
  }, [search, orders]);

  const handleScanClick = () => {
    setShowScanner(true);
    setScanning(true);
    setSearch("");
  };

  const handleScanned = (code) => {
    setShowScanner(false);
    setScanning(false);
    autoPrintByCode(code);
  };

  const filterOptions = [
    { value: "", label: "Tất cả" },
    { value: "Đã thanh toán", label: "Đã thanh toán", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { value: "Chờ thanh toán", label: "Chờ thanh toán", cls: "bg-amber-50 text-amber-600 border-amber-200" },
    { value: "Đã hoàn tiền", label: "Đã hoàn tiền", cls: "bg-blue-50 text-blue-600 border-blue-200" },
    { value: "Đã hủy", label: "Đã hủy", cls: "bg-red-50 text-red-500 border-red-200" },
    { value: "Hết hạn", label: "Hết hạn", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  ];

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.orderId?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.movieTitle?.toLowerCase().includes(q) ||
      o.phone?.includes(q);
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const computedTotalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const pagedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setTotalPages(computedTotalPages); }, [computedTotalPages]);

  // Reset to page 1 when filter/search changes
  const handleSearch = (val) => { setSearch(val); resetPage(); };
  const handleFilterStatus = (val) => { setFilterStatus(val); resetPage(); };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scaleY(0.95); }
          to   { opacity: 1; transform: translateY(0) scaleY(1); }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quản lý Đơn hàng</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">Kiểm tra và in vé cho khách</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <a
            href="/scan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 border shadow-sm shrink-0 bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 hover:text-[#dc2626]"
            title="Mở trang quét vé ở tab mới"
          >
            <ScanLine size={16} />
            <span className="hidden sm:inline">Quét vé</span>
          </a>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
            <input
              ref={searchRef}
              type="text"
              placeholder={scanning ? "Dí máy quét vào QR code..." : "Tìm mã vé, khách hàng, email, phim..."}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onBlur={() => { if (scanning && !search) setScanning(false); }}
              className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${scanning
                ? "border-[#dc2626] focus:ring-red-200 bg-red-50 dark:bg-red-900/20 dark:text-white"
                : "bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 focus:border-[#dc2626] focus:ring-red-100 dark:text-white"
                }`}
            />
          </div>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleFilterStatus(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 active:scale-95 ${filterStatus === opt.value
              ? opt.cls || "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600"
              : "bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-400 border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mx-auto"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600 text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold">
                <th className="p-4 pl-6">Mã vé</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Phim / Suất chiếu</th>
                <th className="p-4">Tổng tiền</th>
                <th className="p-4 text-center">Trạng thái đơn</th>
                <th className="p-4 text-center">Trạng thái vé</th>
                <th className="p-4 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody key={currentPage} className="divide-y divide-slate-100 dark:divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="7" className="p-12 text-center text-slate-400 dark:text-gray-400 italic">
                  {search || filterStatus ? "Không tìm thấy đơn hàng phù hợp." : "Chưa có đơn hàng nào."}
                </td></tr>
              ) : pagedOrders.map((order, index) => (
                <tr
                  key={`${order.orderId}-${index}`}
                  className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-all duration-150"
                  style={{ animation: "rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${index * 40}ms` }}
                >
                  <td className="p-4 pl-6 font-mono font-bold text-slate-700 dark:text-white">
                    {order.orderId}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800 dark:text-white">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-400 dark:text-gray-500" />
                      <span className="truncate">{order.customerEmail || "—"}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">{order.phone}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-700 dark:text-white">
                      {order.movieTitle}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">
                      {order.showDate} - {order.showTime}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-[#dc2626]">
                    {order.finalTotalPrice?.toLocaleString()} đ
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${order.status === "Đã thanh toán" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" :
                      order.status === "Đã hoàn tiền" ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" :
                        order.status === "Đã hủy" ? "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                          order.status === "Hết hạn" ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" :
                          "bg-amber-50 text-amber-600 border-amber-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {order.status === "Đã thanh toán" ? (
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${order.ticketStatus === "printed"
                        ? "bg-teal-50 text-teal-600 border-teal-200"
                        : "bg-orange-50 text-orange-600 border-orange-200"
                        }`}>
                        {order.ticketStatus === "printed" ? "ĐÃ IN" : "CHƯA IN"}
                      </span>
                    ) : <span className="text-slate-300 dark:text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status === "Chờ thanh toán" && order.paymentMethod === "cash" && (
                        <button
                          onClick={() => onConfirm(order.bookingRawId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 border border-emerald-200 dark:border-emerald-800"
                        >
                          <CheckCircle size={14} /> Xác nhận
                        </button>
                      )}
                      <button
                        onClick={() => onViewTicket(order)}
                        className="p-2 text-slate-400 dark:text-gray-400 hover:text-[#dc2626] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-150 active:scale-90"
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Hiển thị <span className="font-bold text-slate-700 dark:text-gray-300">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)}</span> / <span className="font-bold text-slate-700 dark:text-gray-300">{filteredOrders.length}</span> đơn hàng
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
            >
              ‹ Trước
            </button>
            {paginationItems.map((p, i) =>
              p === null ? (
                <span key={`dots-${i}`} className="px-2 text-slate-400 dark:text-gray-600 text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-bold transition-all duration-150 active:scale-95 ${currentPage === p
                    ? "bg-[#dc2626] text-white shadow-sm shadow-red-200"
                    : "border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50"
                    }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
            >
              Sau ›
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <QrScannerModal
          onScanned={handleScanned}
          onClose={() => { setShowScanner(false); setScanning(false); }}
        />
      )}
    </div>
  );
};
