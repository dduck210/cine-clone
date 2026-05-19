import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  X,
  Eye,
  ChevronDown,
  Save,
  Filter,
  Plus,
  Clock,
  Edit,
  Trash2,
  Star,
  PlayCircle,
  Search,
} from "lucide-react";

export const ErrorMsg = ({ msg }) => (
  <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p>
);

export const MovieDetailModal = ({ movie, onClose, onEdit }) => {
  const genreText = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g)).join(", ")
    : movie.genre || "—";
  const isShowing = movie.status === "now_showing";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{movie.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chi tiết phim</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-200">
              <Edit size={14} /> Chỉnh sửa
            </button>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex gap-5">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-28 shrink-0 rounded-xl shadow-md border border-slate-100 object-cover"
              style={{ aspectRatio: "2/3" }}
              onError={(e) => { e.target.src = "https://via.placeholder.com/112x168?text=No+Image"; }}
            />
            <div className="flex-1 grid grid-cols-2 gap-2 content-start">
              {[
                { label: "Thể loại", value: genreText },
                { label: "Thời lượng", value: `${movie.duration} phút` },
                { label: "Giới hạn tuổi", value: movie.ageRestriction || "—" },
                { label: "Đánh giá", value: movie.rating ? `⭐ ${movie.rating}/10` : "—" },
                { label: "Đạo diễn", value: movie.director || "—" },
                { label: "Ngày ra mắt", value: movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "—" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                  <p className="font-bold text-slate-800 text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isShowing ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isShowing ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {isShowing ? "Đang chiếu" : "Sắp chiếu"}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Diễn viên</p>
              <p className="font-medium text-slate-700 text-sm line-clamp-2">{movie.cast || "—"}</p>
            </div>
          </div>

          {movie.description && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Mô tả phim</p>
              <p className="text-sm text-slate-700 leading-relaxed">{movie.description}</p>
            </div>
          )}

          {movie.trailer && (
            <a href={movie.trailer} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#dc2626] hover:underline">
              <PlayCircle size={16} /> Xem trailer
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

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
      status: "now_showing",
      poster: "",
      description: "",
      director: "",
      cast: "",
      releaseDate: "",
      ageRestriction: "T13",
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
                Thời lượng (phút) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("duration", {
                  required: "Nhập thời lượng phim",
                  valueAsNumber: true,
                  min: { value: 1, message: "Tối thiểu 1 phút" },
                  max: { value: 500, message: "Tối đa 500 phút" },
                })}
                className={inputClass(errors.duration)}
                placeholder="VD: 120"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Đạo diễn
              </label>
              <input
                {...register("director")}
                className={inputClass(false)}
                placeholder="Tên đạo diễn..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Ngày ra mắt
              </label>
              <input
                type="date"
                {...register("releaseDate")}
                className={inputClass(false)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Diễn viên chính
            </label>
            <input
              {...register("cast")}
              className={inputClass(false)}
              placeholder="VD: Tom Hanks, Scarlett Johansson..."
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Mô tả phim
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className={`${inputClass(false)} resize-none`}
              placeholder="Nội dung tóm tắt phim..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Giới hạn tuổi
              </label>
              <div className="relative">
                <select
                  {...register("ageRestriction")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 appearance-none font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="P">P — Mọi lứa tuổi</option>
                  <option value="T13">T13 — Từ 13 tuổi</option>
                  <option value="T16">T16 — Từ 16 tuổi</option>
                  <option value="T18">T18 — Từ 18 tuổi</option>
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
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
                  <option value="now_showing">🟢 Đang chiếu</option>
                  <option value="coming_soon">🟡 Sắp chiếu</option>
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
              </div>
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
}) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [detailMovie, setDetailMovie] = useState(null);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilter(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const genreOptions = Array.from(new Set(
    movies.flatMap((movie) => (
      Array.isArray(movie.genre)
        ? movie.genre.map((genre) => (typeof genre === "object" ? genre.name : genre))
        : movie.genre
          ? [movie.genre]
          : []
    )).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));

  const filteredMovies = movies.filter((movie) => {
    const matchesStatus = !filterStatus || movie.status === filterStatus;
    const genreNames = Array.isArray(movie.genre)
      ? movie.genre.map((genre) => (typeof genre === "object" ? genre.name : genre))
      : movie.genre
        ? [movie.genre]
        : [];
    const matchesGenre = !filterGenre || genreNames.includes(filterGenre);
    const matchesSearch = !search.trim() || movie.title?.toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesGenre && matchesSearch;
  });

  const filterOptions = [
    { value: "", label: "Tất cả" },
    { value: "now_showing", label: "Đang chiếu" },
    { value: "coming_soon", label: "Sắp chiếu" },
  ];

  return (
  <>
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
        <div className="relative flex-1 sm:w-64">
          <Search size={18} className="absolute left-3 top-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên phim..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#dc2626]"
          />
        </div>
        <div className="relative hidden sm:block">
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#dc2626] appearance-none"
          >
            <option value="">Tất cả thể loại</option>
            {genreOptions.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
        </div>
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`flex-1 sm:flex-none justify-center px-4 py-2.5 border rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm ${
              filterStatus
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter size={18} />
            <span>{filterStatus ? filterOptions.find(o => o.value === filterStatus)?.label : "Lọc"}</span>
            {filterStatus && (
              <span
                onClick={(e) => { e.stopPropagation(); setFilterStatus(""); }}
                className="ml-1 hover:text-red-800"
              >
                <X size={14} />
              </span>
            )}
          </button>
          {showFilter && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterStatus(opt.value); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                    filterStatus === opt.value
                      ? "bg-red-50 text-red-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
            {filteredMovies.length > 0 ? (
              filteredMovies.map((movie) => {
                const genreText = Array.isArray(movie.genre)
                  ? movie.genre.map((g) => (typeof g === "object" ? g.name : g)).join(", ")
                  : movie.genre || "";
                const statusLabel = movie.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu";
                const statusClass = movie.status === "now_showing"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-amber-50 text-amber-600 border-amber-100";
                const dotClass = movie.status === "now_showing"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500";
                return (
                <tr
                  key={movie._id}
                  onClick={() => setDetailMovie(movie)}
                  className="group hover:bg-slate-50/80 transition-colors duration-200 cursor-pointer"
                >
                  <td className="p-5 pl-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 rounded-lg bg-slate-200 overflow-hidden shadow-sm border border-slate-100 flex-shrink-0 group-hover:shadow-md transition-all relative">
                        <img
                          src={movie.poster}
                          alt=""
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/48x64?text=IMG"; }}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-base mb-1 group-hover:text-[#dc2626] transition-colors">
                          {movie.title}
                        </div>
                        <div className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                          #{movie._id?.toString().slice(-6)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-sm font-medium text-slate-600">{genreText || "—"}</span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock size={14} /> {movie.duration} phút
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`}></span>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="p-5 pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 items-center">
                      <button onClick={() => setDetailMovie(movie)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Xem chi tiết">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleEdit(movie)} className="p-2 text-slate-400 hover:text-[#dc2626] hover:bg-red-50 rounded-lg transition-all" title="Sửa">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(movie)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-16 text-center text-slate-400 italic bg-slate-50/50"
                >
                  {filterStatus ? "Không có phim nào phù hợp bộ lọc." : "Chưa có dữ liệu phim nào."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  {detailMovie && (
    <MovieDetailModal
      movie={detailMovie}
      onClose={() => setDetailMovie(null)}
      onEdit={() => { handleEdit(detailMovie); setDetailMovie(null); }}
    />
  )}
  </>
  );
};
