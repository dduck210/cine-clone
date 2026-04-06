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

export const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-bold">Chi tiết vé</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-6">Đang tải dữ liệu vé...</div>
      </div>
    </div>
  );
};

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
  ];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
        <h2 className="text-xl font-bold">Quản lý Đơn hàng</h2>
      </div>
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-left">
          <tbody>
            {mockOrders.map((order) => (
              <tr key={order.orderId} className="border-t">
                <td className="p-4">{order.orderId}</td>
                <td className="p-4">
                  <button
                    onClick={() => onViewTicket(order)}
                    className="text-blue-500"
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
