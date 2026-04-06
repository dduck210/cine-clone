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
    </div>
  );
};
