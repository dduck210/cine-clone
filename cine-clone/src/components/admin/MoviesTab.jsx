import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  X,
  Eye,
  ChevronDown,
  Save,
  Filter,
  Plus,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";

export const ErrorMsg = ({ msg }) => (
  <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 animate-fade-in-down">
    <AlertCircle size={12} /> {msg}
  </p>
);

export const MovieModal = ({ currentMovie, setIsModalOpen, handleSave }) => {
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

  const inputClass = (error) =>
    `w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none transition-all duration-300 font-medium text-slate-700 ${error ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-100 placeholder-red-300 animate-shake" : "border-slate-200 focus:border-[#dc2626] focus:bg-white focus:ring-4 focus:ring-red-50 hover:border-slate-300"}`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsModalOpen(false)}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-800 tracking-tight">
              {currentMovie ? "Chỉnh sửa Phim" : "Thêm Phim Mới"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
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
          className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              <div className="hidden sm:flex w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden items-center justify-center text-slate-300">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 appearance-none font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
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
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-50 mt-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-all text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:shadow-red-300 transition-all transform hover:-translate-y-0.5 text-sm flex items-center gap-2"
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

export const MoviesManager = ({
  movies,
  handleAddNew,
  handleEdit,
  handleDeleteClick,
}) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div className="w-full sm:w-auto">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
          Kho Phim
        </h2>
        <p className="text-xs md:text-sm text-slate-500">
          Quản lý toàn bộ danh sách phim
        </p>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <button className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
          <Filter size={18} /> <span>Lọc</span>
        </button>
        <button
          onClick={handleAddNew}
          className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 flex items-center gap-2"
        >
          <Plus size={20} /> <span>Thêm</span>
        </button>
      </div>
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
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
                        <div className="font-bold text-slate-800 text-base mb-1 group-hover:text-[#dc2626] transition-colors">
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
                        className="p-2 text-slate-400 hover:text-[#dc2626] hover:bg-red-50 rounded-lg transition-all tooltip"
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
