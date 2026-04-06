import React from "react";
import {
  Ticket,
  X,
  User,
  MapPin,
  Calendar,
  Clock,
  Printer,
  Eye,
} from "lucide-react";

export const OrdersManager = ({ onViewTicket }) => {
  const mockOrders = [
    {
      orderId: "XC-99281",
      customerName: "Nguyễn Văn A",
      phone: "0987654321",
      bookingTime: "06/04/2026 14:30",
      movieTitle: "Avatar: The Way of Water",
      cinemaName: "Lotte Cinema Long Biên",
      showDate: "06/04/2026",
      showTime: "19:00",
      selectedSeats: ["G4", "G5"],
      finalTotalPrice: 240000,
      status: "Thành công",
    },
    {
      orderId: "XC-12345",
      customerName: "Trần Thị B",
      phone: "0912345678",
      bookingTime: "06/04/2026 15:00",
      movieTitle: "Mai",
      cinemaName: "Lotte Cinema Long Biên",
      showDate: "07/04/2026",
      showTime: "20:00",
      selectedSeats: ["A1", "A2", "A3"],
      finalTotalPrice: 360000,
      status: "Thành công",
    },
  ];
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
              <th className="p-4 pl-6">Mã ĐH</th>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">Phim / Suất chiếu</th>
              <th className="p-4">Tổng tiền</th>
              <th className="p-4 text-right pr-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockOrders.map((order) => (
              <tr
                key={order.orderId}
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
                  {order.finalTotalPrice.toLocaleString()} đ
                </td>
                <td className="p-4 pr-6 text-right">
                  <button
                    onClick={() => onViewTicket(order)}
                    className="p-2 text-slate-400 hover:text-[#0369a1] hover:bg-blue-50 rounded-lg transition-all tooltip"
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
