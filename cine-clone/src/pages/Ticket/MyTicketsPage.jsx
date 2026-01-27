import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { Calendar, MapPin, Clock, Ticket, ChevronRight } from "lucide-react";

const MyTicketsPage = () => {
  const navigate = useNavigate();

  const mockTickets = [
    {
      id: "XC-883921",
      movieTitle: "Phi Vụ Động Trời 2",
      cinema: "5Cine Royal City",
      address: "Rạp 03 • Tầng 4",
      date: "20/07/2024",
      time: "19:30",
      seats: "D8, D9",
      poster: "https://image.tmdb.org/t/p/w500/8xV47NDrjdZDpkVcCFqkdHa3T0C.jpg",
      status: "active",
      price: 240000,
    },
    {
      id: "XC-772102",
      movieTitle: "Spider-Man: Across the Spider-Verse",
      cinema: "5Cine Cầu Giấy",
      address: "Rạp 01 • Tầng 5",
      date: "15/06/2024",
      time: "20:00",
      seats: "F5, F6",
      poster: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
      status: "used",
      price: 240000,
    },
    {
      id: "XC-110293",
      movieTitle: "Dune: Part Two",
      cinema: "5Cine Times City",
      address: "Rạp IMAX • Tầng B1",
      date: "01/03/2024",
      time: "18:15",
      seats: "G10, G11, G12",
      poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
      status: "cancelled",
      price: 360000,
    },
  ];

  const [activeTab, setActiveTab] = useState("all");

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "active", label: "Sắp chiếu" },
    { id: "used", label: "Đã xem" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const filteredTickets =
    activeTab === "all"
      ? mockTickets
      : mockTickets.filter((t) => t.status === activeTab);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
            Sắp chiếu
          </span>
        );
      case "used":
        return (
          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
            Đã xem
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const handleViewDetail = (ticket) => {
    navigate("/payment-success", {
      state: {
        movieTitle: ticket.movieTitle,
        cinemaName: ticket.cinema,
        showTime: ticket.time,
        showDate: ticket.date,
        showAddress: ticket.address || "Rạp 5Cine",
        selectedSeats: ticket.seats.split(", "),
        combos: [],
        finalTotalPrice: ticket.price,
        poster: ticket.poster,
        orderId: ticket.id,
        isHistoryMode: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 border-l-4 border-red-600 pl-4">
              Vé của tôi
            </h1>
            <p className="text-gray-500 pl-5">
              Quản lý và xem lại lịch sử đặt vé của bạn.
            </p>
          </div>

          <div className="relative flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full max-w-[480px]">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-red-600 shadow-md transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]"
              style={{
                left: "4px",
                width: `calc((100% - 8px) / 4)`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            ></div>

            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-200 capitalize
                            ${
                              activeTab === tab.id
                                ? "text-white"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleViewDetail(ticket)}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-red-200 transition-all flex flex-col sm:flex-row gap-6 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-2 h-full bg-red-600 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>

                <div className="w-full sm:w-24 h-36 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200 relative shadow-sm">
                  <img
                    src={ticket.poster}
                    alt={ticket.movieTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {ticket.status === "active" && (
                    <div className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-red-600 transition-colors">
                      {ticket.movieTitle}
                    </h3>
                    {getStatusBadge(ticket.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-red-600" />{" "}
                      {ticket.cinema}
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket size={16} className="text-red-600" /> Ghế:{" "}
                      <span className="font-bold text-gray-900">
                        {ticket.seats}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-red-600" />{" "}
                      {ticket.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-red-600" /> {ticket.time}
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-dashed border-gray-100 pt-4">
                    <p className="text-xs text-gray-400 font-mono">
                      ID: {ticket.id}
                    </p>
                    <div className="flex items-center gap-2 text-red-600 font-bold">
                      {ticket.price.toLocaleString()} đ
                      <ChevronRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">
                Chưa có vé nào ở mục này.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyTicketsPage;
