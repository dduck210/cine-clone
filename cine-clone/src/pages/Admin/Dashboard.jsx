import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/admin/Sidebar";
import {
  Search,
  Bell,
  DollarSign,
  Ticket,
  Clock,
  User,
  MoreHorizontal,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { stats, moviesList as initialMovies } from "../../data/adminData";

// Nhúng 2 tab đã tách
import {
  OrdersManager,
  OrderDetailModal,
} from "../../components/admin/OrdersTab";
import { MoviesManager, MovieModal } from "../../components/admin/MoviesTab";

const toastConfig = {
  position: "top-right",
  toastOptions: {
    duration: 4000,
    className:
      "!bg-white !text-slate-800 !shadow-2xl !rounded-xl !border !border-slate-100 !font-medium",
  },
};

const DashboardView = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {stats.map((stat, index) => (
      <div
        key={index}
        className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(220,38,38,0.1)] border border-slate-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-4">
          <div
            className={`p-3 rounded-2xl ${stat.icon === "DollarSign" ? "bg-emerald-50 text-emerald-600" : stat.icon === "Ticket" ? "bg-red-50 text-[#dc2626]" : "bg-amber-50 text-amber-600"}`}
          >
            {stat.icon === "DollarSign" && <DollarSign size={24} />}
            {stat.icon === "Ticket" && <Ticket size={24} />}
            {stat.icon === "Clock" && <Clock size={24} />}
          </div>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${stat.sub.includes("Tăng") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
          >
            {stat.sub.includes("Tăng") ? "+" : ""}
            {stat.sub.split(" ")[1]}
          </span>
        </div>
        <div>
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
            {stat.label}
          </p>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1 group-hover:text-[#dc2626] transition-colors">
            {stat.value}
          </h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">{stat.sub}</p>
        </div>
      </div>
    ))}
  </div>
);

const UsersManager = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
      Thành viên hệ thống
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md hover:border-red-100 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-[#dc2626] group-hover:text-white transition-colors duration-300">
            <User size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 truncate">User_{item}</h4>
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              user{item}@example.com
            </p>
          </div>
          <button className="ml-auto text-slate-300 hover:text-slate-600">
            <MoreHorizontal size={20} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [movies, setMovies] = useState(() => {
    const saved = localStorage.getItem("admin_movies");
    return saved ? JSON.parse(saved) : initialMovies;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);

  // State quản lý vé
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("admin_movies", JSON.stringify(movies));
  }, [movies]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setIsSidebarOpen(false);
  };
  const handleDeleteClick = (movie) => {
    setMovieToDelete(movie);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = () => {
    if (movieToDelete) {
      setMovies(movies.filter((movie) => movie.id !== movieToDelete.id));
      toast.success("Đã xóa phim thành công!");
    }
    setIsDeleteModalOpen(false);
    setMovieToDelete(null);
  };
  const handleAddNew = () => {
    setCurrentMovie(null);
    setIsModalOpen(true);
  };
  const handleEdit = (movie) => {
    setCurrentMovie(movie);
    setIsModalOpen(true);
  };
  const handleViewTicket = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleSave = (data) => {
    const promise = new Promise((resolve) => setTimeout(resolve, 800));
    toast.promise(promise, {
      loading: "Đang xử lý...",
      success: () => {
        if (currentMovie) {
          setMovies(
            movies.map((m) =>
              m.id === currentMovie.id ? { ...data, id: currentMovie.id } : m,
            ),
          );
          return "Đã cập nhật thông tin phim!";
        } else {
          const newMovie = {
            ...data,
            id: `mov${Date.now()}`,
            poster:
              data.poster || "https://via.placeholder.com/300x400?text=No+Img",
          };
          setMovies([newMovie, ...movies]);
          return "Đã thêm phim mới vào kho!";
        }
      },
      error: "Có lỗi xảy ra",
    });
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-[50] w-64 bg-white border-r border-slate-200 transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:block`}
      >
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        <header className="flex justify-between items-center px-4 md:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-white/50 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg active:scale-95 transition-all"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-extrabold text-slate-800 capitalize tracking-tight flex items-center gap-2">
                {activeTab === "dashboard"
                  ? "Tổng Quan"
                  : activeTab === "movies"
                    ? "Quản Lý Phim"
                    : activeTab === "orders"
                      ? "Đơn Hàng"
                      : "Thành Viên"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-[#dc2626] hover:shadow-md transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="w-10 h-10 bg-[#dc2626] rounded-xl text-white flex items-center justify-center font-bold shadow-lg shadow-red-200 cursor-pointer">
              A
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <Toaster {...toastConfig} />
          <div className="animate-fade-in-up pb-10">
            {activeTab === "dashboard" && <DashboardView />}
            {activeTab === "movies" && (
              <MoviesManager
                movies={movies}
                handleAddNew={handleAddNew}
                handleEdit={handleEdit}
                handleDeleteClick={handleDeleteClick}
              />
            )}
            {activeTab === "users" && <UsersManager />}
            {activeTab === "orders" && (
              <OrdersManager onViewTicket={handleViewTicket} />
            )}
          </div>
        </div>
      </main>

      {/* Render Modals */}
      {isModalOpen && (
        <MovieModal
          currentMovie={currentMovie}
          setIsModalOpen={setIsModalOpen}
          handleSave={handleSave}
        />
      )}
      {isOrderModalOpen && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setIsOrderModalOpen(false)}
        />
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scale-up p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Xác nhận xoá phim?
            </h3>
            <p className="text-gray-500 text-sm mb-6 px-2">
              Bạn có chắc chắn muốn xoá phim{" "}
              <span className="font-bold text-gray-800">
                "{movieToDelete?.title}"
              </span>{" "}
              không?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-xl transition-all"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
