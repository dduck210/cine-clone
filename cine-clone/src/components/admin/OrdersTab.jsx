import React, { useState } from "react";
import {
  Ticket,
  X,
  User,
  MapPin,
  Calendar,
  Clock,
  Printer,
  Eye,
  Crown,
} from "lucide-react";

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
        </div>
      </div>
    </div>
  );
};

export const OrdersManager = ({ onViewTicket }) => {
  const [orders, setOrders] = useState(() => {
    const mockOrders = [
      {
        orderId: "XC-99281",
        customerName: "Dương Anh Đức",
        phone: "0987654321",
        bookingTime: "06/04/2026 14:30",
        movieTitle: "Avatar: Dòng Chảy Của Nước",
        cinemaName: "5Cine Royal City",
        showDate: "20/07/2024",
        showTime: "15:00",
        selectedSeats: ["G11"],
        finalTotalPrice: 120000,
        status: "Đã thanh toán",
      },
      {
        orderId: "XC-12345",
        customerName: "Nguyễn Văn Hoàn",
        phone: "0912345678",
        bookingTime: "06/04/2026 15:00",
        movieTitle: "Mai",
        cinemaName: "5Cine Royal City",
        showDate: "20/07/2024",
        showTime: "20:00",
        selectedSeats: ["A1", "A2", "A3"],
        finalTotalPrice: 360000,
        status: "Chờ thanh toán",
      },
    ];
    const savedOrders = localStorage.getItem("admin_orders");
    if (savedOrders) return [...JSON.parse(savedOrders), ...mockOrders];
    return mockOrders;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Đơn hàng</h2>
          <p className="text-sm text-slate-500">Kiểm tra và in vé cho khách</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4 pl-6">Mã vé</th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Phim / Suất chiếu</th>
              <th className="p-4">Tổng tiền</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right pr-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order, index) => (
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
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${order.status === "Đã thanh toán" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <button
                    onClick={() => onViewTicket(order)}
                    className="p-2 text-slate-400 hover:text-[#dc2626] hover:bg-red-50 rounded-lg transition-all tooltip"
                    title="Xem chi tiết vé"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
