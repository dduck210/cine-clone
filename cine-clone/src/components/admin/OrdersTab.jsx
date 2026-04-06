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
