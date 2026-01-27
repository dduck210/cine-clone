import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/admin/Sidebar";
import {
  Search,
  Bell,
  DollarSign,
  Ticket,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  X,
  Save,
  AlertCircle,
  ChevronDown,
  Filter,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import { stats, moviesList as initialMovies } from "../../data/adminData";

const toastConfig = {
  position: "top-right",
  toastOptions: {
    duration: 4000,
    className:
      "!bg-white !text-slate-800 !shadow-2xl !rounded-xl !border !border-slate-100 !font-medium",
    success: { iconTheme: { primary: "#10b981", secondary: "white" } },
    error: { iconTheme: { primary: "#ef4444", secondary: "white" } },
  },
};

const MovieModal = ({ currentMovie, setIsModalOpen, handleSave }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: currentMovie || {
      title: "",
      genre: "",
      duration: "",
      status: "Đang chiếu",
      poster: "",
    },
  });

  useEffect(() => {
    if (currentMovie) reset(currentMovie);
  }, [currentMovie, reset]);

  const inputClass = (error) => `
    w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none transition-all duration-300 font-medium text-slate-700
    ${
      error
        ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-100 placeholder-red-300 animate-shake"
        : "border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 hover:border-slate-300"
    }
  `;

  const ErrorMsg = ({ msg }) => (
    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 animate-fade-in-down">
      <AlertCircle size={12} /> {msg}
    </p>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsModalOpen(false)}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-slate-100">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-xl text-slate-800 tracking-tight">
              {currentMovie ? "Chỉnh sửa Phim" : "Thêm Phim Mới"}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Vui lòng nhập đầy đủ thông tin
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(handleSave)}
          className="p-8 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar"
        >
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Tên phim <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title", {
                required: "Tên phim không được để trống",
              })}
              className={inputClass(errors.title)}
              placeholder="VD: Avatar 2..."
              autoFocus
            />
            {errors.title && <ErrorMsg msg={errors.title.message} />}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Thể loại <span className="text-red-500">*</span>
              </label>
              <input
                {...register("genre", { required: "Nhập thể loại" })}
                className={inputClass(errors.genre)}
                placeholder="Hành động..."
              />
              {errors.genre && <ErrorMsg msg={errors.genre.message} />}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Thời lượng <span className="text-red-500">*</span>
              </label>
              <input
                {...register("duration", { required: "Nhập thời lượng" })}
                className={inputClass(errors.duration)}
                placeholder="120 phút"
              />
              {errors.duration && <ErrorMsg msg={errors.duration.message} />}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Poster URL
            </label>
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <input
                  {...register("poster", {
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: "Link phải bắt đầu bằng http/https",
                    },
                  })}
                  className={inputClass(errors.poster)}
                  placeholder="https://..."
                />
                {errors.poster && <ErrorMsg msg={errors.poster.message} />}
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-300">
                <Eye size={20} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Trạng thái
            </label>
            <div className="relative">
              <select
                {...register("status")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-50 appearance-none font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="Đang chiếu">🟢 Đang chiếu</option>
                <option value="Sắp chiếu">🟡 Sắp chiếu</option>
                <option value="Ngưng chiếu">🔴 Ngưng chiếu</option>
              </select>
              <ChevronDown
                className="absolute right-4 top-3.5 text-slate-400 pointer-events-none"
                size={18}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-50 mt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-all text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all transform hover:-translate-y-0.5 text-sm flex items-center gap-2"
            >
              <Save size={18} />{" "}
              {currentMovie ? "Lưu Thay Đổi" : "Tạo Phim Mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MoviesManager = ({
  movies,
  handleAddNew,
  handleEdit,
  handleDeleteClick,
}) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          Kho Phim
        </h2>
        <p className="text-sm text-slate-500">
          Quản lý toàn bộ danh sách phim và trạng thái hiển thị
        </p>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm">
          <Filter size={18} /> <span className="hidden sm:inline">Bộ lọc</span>
        </button>
        <button
          onClick={handleAddNew}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
        >
          <Plus size={20} /> <span className="hidden sm:inline">Thêm Phim</span>
        </button>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-5 pl-8">Thông tin phim</th>
              <th className="p-5">Thể loại</th>
              <th className="p-5">Thời lượng</th>
              <th className="p-5">Trạng thái</th>
              <th className="p-5 pr-8 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movies.length > 0 ? (
              movies.map((movie) => (
                <tr
                  key={movie.id}
                  className="group hover:bg-slate-50/80 transition-colors duration-200"
                >
                  <td className="p-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 rounded-lg bg-slate-200 overflow-hidden shadow-sm border border-slate-100 flex-shrink-0 group-hover:shadow-md transition-all relative">
                        <img
                          src={movie.poster}
                          alt=""
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/48x64?text=IMG";
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                          {movie.title}
                        </div>
                        <div className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                          #{movie.id.toString().slice(-3)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-sm font-medium text-slate-600">
                      {movie.genre}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock size={14} /> {movie.duration}
                    </div>
                  </td>
                  <td className="p-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${movie.status === "Đang chiếu" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : movie.status === "Sắp chiếu" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${movie.status === "Đang chiếu" ? "bg-emerald-500 animate-pulse" : movie.status === "Sắp chiếu" ? "bg-amber-500" : "bg-slate-400"}`}
                      ></span>
                      {movie.status}
                    </span>
                  </td>
                  <td className="p-5 pr-8 text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(movie)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all tooltip"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(movie)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all tooltip"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-16 text-center text-slate-400 italic bg-slate-50/50"
                >
                  Chưa có dữ liệu phim nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const DashboardView = () => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div
              className={`p-3 rounded-2xl ${stat.icon === "DollarSign" ? "bg-emerald-50 text-emerald-600" : stat.icon === "Ticket" ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"}`}
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
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1 group-hover:text-indigo-600 transition-colors">
              {stat.value}
            </h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              {stat.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[300px] flex items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white"></div>
      <div className="relative z-10 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-300 group-hover:scale-110 transition-transform duration-500">
          <Clock size={32} />
        </div>
        <h4 className="text-slate-800 font-bold text-lg">Biểu đồ doanh thu</h4>
        <p className="text-slate-400 text-sm">
          Tính năng đang được phát triển...
        </p>
      </div>
    </div>
  </>
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
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            <User size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800">User_{item}</h4>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p className="text-xs text-slate-400">user{item}@example.com</p>
            <div className="mt-2 text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 w-fit">
              ADMIN
            </div>
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

  const [movies, setMovies] = useState(() => {
    const saved = localStorage.getItem("admin_movies");
    return saved ? JSON.parse(saved) : initialMovies;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);

  useEffect(() => {
    localStorage.setItem("admin_movies", JSON.stringify(movies));
  }, [movies]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
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
    <div className="bg-slate-50/50 min-h-screen font-sans text-slate-900 flex">
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      <Toaster {...toastConfig} />

      {isModalOpen && (
        <MovieModal
          currentMovie={currentMovie}
          setIsModalOpen={setIsModalOpen}
          handleSave={handleSave}
        />
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scale-up">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Xác nhận xoá phim?
              </h3>

              <p className="text-gray-500 text-sm mb-6 text-justify px-2">
                Bạn có chắc chắn muốn xoá phim{" "}
                <span className="font-bold text-gray-800">
                  "{movieToDelete?.title}"
                </span>{" "}
                không? Hành động này không thể hoàn tác.
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
        </div>
      )}

      <main className="flex-1 ml-64 p-8 transition-all duration-300">
        <header className="flex justify-between items-center mb-10 sticky top-4 z-40 bg-white/80 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-white/50">
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-slate-800 capitalize tracking-tight flex items-center gap-2">
              {activeTab === "dashboard"
                ? "Tổng Quan"
                : activeTab === "movies"
                  ? "Quản Lý Phim"
                  : "Thành Viên"}
            </h1>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search
                className="absolute left-3 top-2.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm nhanh..."
                className="pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:shadow-sm transition-all outline-none w-64"
              />
            </div>
            <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 hover:shadow-md transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200 cursor-pointer hover:scale-105 transition-transform">
              A
            </div>
          </div>
        </header>

        <div className="animate-fade-in-up">
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
          {(activeTab === "schedules" || activeTab === "orders") && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <Clock size={48} className="mb-4 text-slate-200" />
              <p className="font-semibold text-lg text-slate-400">
                Module đang được xây dựng
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
