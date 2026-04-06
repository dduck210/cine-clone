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
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in print:shadow-none print:max-h-none print:w-full">
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
        <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-50 p-6 print:p-0 print:bg-white">
          <div className="bg-white rounded-2xl p-5 mb-6 border border-slate-200 shadow-sm print:hidden">
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  Đã thanh toán
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-slate-200 relative print:shadow-none print:border-black">
            <div className="bg-slate-800 p-6 text-white relative overflow-hidden print:bg-black print:text-black">
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {order.movieTitle}
                  </h2>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm print:border print:border-black print:text-black">
                    2D Phụ Đề
                  </span>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl print:hidden"></div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                      Rạp chiếu
                    </p>
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      <MapPin
                        size={16}
                        className="text-[#0369a1] print:hidden"
                      />{" "}
                      {order.cinemaName}
                    </p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                        Ngày chiếu
                      </p>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        <Calendar
                          size={16}
                          className="text-[#0369a1] print:hidden"
                        />{" "}
                        {order.showDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                        Giờ chiếu
                      </p>
                      <p className="font-bold text-slate-900 flex items-center gap-2">
                        <Clock
                          size={16}
                          className="text-[#0369a1] print:hidden"
                        />{" "}
                        {order.showTime}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
                      Ghế ngồi
                    </p>
                    <p className="font-extrabold text-[#0369a1] text-xl tracking-widest print:text-black">
                      {order.selectedSeats.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-200 border-dashed print:bg-white print:border-black">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${order.orderId}`}
                    alt="QR Code"
                    className="w-28 h-28 mix-blend-multiply"
                  />
                  <p className="font-mono font-bold text-slate-800 text-sm mt-2 tracking-widest">
                    {order.orderId}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-900 font-bold text-lg">
                  <span>Tổng tiền đã thu:</span>
                  <span className="text-[#dc2626] print:text-black">
                    {order.finalTotalPrice.toLocaleString()} đ
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute left-0 bottom-16 w-4 h-8 bg-slate-50 rounded-r-full border-r border-y border-slate-200 print:hidden"></div>
            <div className="absolute right-0 bottom-16 w-4 h-8 bg-slate-50 rounded-l-full border-l border-y border-slate-200 print:hidden"></div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold transition-all text-sm"
          >
            Đóng
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2.5 bg-[#0369a1] hover:bg-[#0284c7] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all text-sm flex items-center gap-2"
          >
            <Printer size={18} /> In vé cứng
          </button>
        </div>
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
