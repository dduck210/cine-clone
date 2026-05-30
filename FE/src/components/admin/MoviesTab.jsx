import React, { useEffect, useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  X,
  Eye,
  ChevronDown,
  Save,
  Filter,
  Plus,
  Clock,
  Edit,
  Star,
  PlayCircle,
  Search,
  Info,
} from "lucide-react";

export const ErrorMsg = ({ msg }) => (
  <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p>
);

export const MovieDetailModal = ({ movie, onClose, onEdit }) => {
  const genreText = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g)).join(", ")
    : movie.genre || "—";
  const statusConfig = {
    now_showing: { label: "Đang chiếu", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", dot: "bg-emerald-500 animate-pulse" },
    coming_soon: { label: "Sắp chiếu",  bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100",   dot: "bg-amber-500" },
    stopped:     { label: "Ngừng chiếu",bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400" },
  };
  const sc = statusConfig[movie.status] || statusConfig.coming_soon;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
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
                { label: "Đánh giá", value: movie.rating ? `⭐ ${movie.rating}/5` : "—" },
                { label: "Đạo diễn", value: movie.director || "—" },
                { label: "Ngày ra mắt", value: movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "—" },
                { label: "Kết thúc chiếu", value: movie.screeningEndDate ? new Date(movie.screeningEndDate).toLocaleDateString("vi-VN") : "—" },
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
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
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

export const MovieModal = ({ currentMovie, setIsModalOpen, handleSave, genreOptions = [] }) => {
  const [selectedGenres, setSelectedGenres] = useState(() => {
    if (!currentMovie?.genre) return [];
    return Array.isArray(currentMovie.genre)
      ? currentMovie.genre.map((g) => (typeof g === "object" ? g._id : g))
      : [];
  });
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const genreDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target))
        setGenreDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleGenre = (id) =>
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const selectedGenreNames = selectedGenres
    .map((id) => genreOptions.find((g) => g._id === id)?.name)
    .filter(Boolean);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: currentMovie || {
      title: "",
      genre: "",
      duration: "",
      status: "now_showing",
      poster: "",
      backdrop: "",
      trailer: "",
      description: "",
      director: "",
      cast: "",
      language: "",
      releaseDate: "",
      screeningEndDate: "",
      ageRestriction: "T13",
    },
  });

  const watchedReleaseDate = useWatch({ control, name: "releaseDate" });
  const watchedEndDate = useWatch({ control, name: "screeningEndDate" });

  const calculateStatus = (releaseDateStr, endDateStr) => {
    if (!releaseDateStr || !endDateStr) return "coming_soon";
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const parseLocal = (dateStr) => {
        const [y, m, d] = dateStr.split("-").map(Number);
        return new Date(y, m - 1, d);
      };
      const start = parseLocal(releaseDateStr);
      const end = parseLocal(endDateStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "coming_soon";

      if (end < today) return "stopped";
      if (start <= today) return "now_showing";
      return "coming_soon";
    } catch {
      return "coming_soon";
    }
  };

  const getPreviewStatus = () => {
    if (!watchedReleaseDate || !watchedEndDate) return null;
    const status = calculateStatus(watchedReleaseDate, watchedEndDate);
    if (status === "stopped") return { label: "Ngừng chiếu", color: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-400" };
    if (status === "now_showing") return { label: "Đang chiếu", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500 animate-pulse" };
    return { label: "Sắp chiếu", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" };
  };
  const preview = getPreviewStatus();

  useEffect(() => {
    if (currentMovie) {
      const ids = Array.isArray(currentMovie.genre)
        ? currentMovie.genre.map((g) => (typeof g === "object" ? g._id : g))
        : [];
      setSelectedGenres(ids);
      const toDateInput = (val) => (val ? new Date(val).toISOString().split("T")[0] : "");
      reset({
        ...currentMovie,
        genre: ids,
        releaseDate: toDateInput(currentMovie.releaseDate),
        screeningEndDate: toDateInput(currentMovie.screeningEndDate),
      });
    }
  }, [currentMovie, reset]);

  const inputClass = (error) =>
    `w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none transition-all duration-300 font-medium text-slate-700 ${
      error
        ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-100 placeholder-red-300 animate-shake"
        : "border-slate-200 focus:border-[#dc2626] focus:bg-white focus:ring-4 focus:ring-red-50 hover:border-slate-300"
    }`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsModalOpen(false)}
      ></div>
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-800 tracking-tight">
              {currentMovie ? "Chỉnh sửa Phim" : "Thêm Phim Mới"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Vui lòng nhập đầy đủ thông tin</p>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit((data) => {
            if (selectedGenres.length === 0) {
              return;
            }
            const finalStatus = calculateStatus(data.releaseDate, data.screeningEndDate);
            handleSave({ ...data, genre: selectedGenres, status: finalStatus });
          })}
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
            <div ref={genreDropdownRef} className="relative">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Thể loại <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setGenreDropdownOpen((o) => !o)}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-left font-medium transition-all flex items-center justify-between ${
                  selectedGenres.length === 0 ? "text-slate-400" : "text-slate-700"
                } ${genreDropdownOpen ? "border-[#dc2626] ring-4 ring-red-50" : "border-slate-200 hover:border-slate-300"}`}
              >
                <span className="truncate text-sm">
                  {selectedGenreNames.length > 0 ? selectedGenreNames.join(", ") : "Chọn thể loại..."}
                </span>
                <ChevronDown size={16} className={`shrink-0 ml-2 text-slate-400 transition-transform ${genreDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {genreDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                  style={{ animation: "dropDown 0.18s ease-out both", transformOrigin: "top" }}>
                  {genreOptions.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Không có thể loại nào</p>
                  ) : (
                    genreOptions.map((g) => (
                      <label key={g._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(g._id)}
                          onChange={() => toggleGenre(g._id)}
                          className="w-4 h-4 accent-[#dc2626] rounded"
                        />
                        <span className="text-sm text-slate-700 font-medium">{g.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
              {selectedGenres.length === 0 && (
                <p className="text-red-500 text-xs mt-1 ml-1">Chọn ít nhất 1 thể loại</p>
              )}
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
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Banner ngang URL <span className="font-normal text-slate-400 normal-case">(ảnh 16:9 cho slider trang chủ)</span>
            </label>
            <input
              {...register("backdrop", {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: "Link phải bắt đầu bằng http/https",
                },
              })}
              className={inputClass(errors.backdrop)}
              placeholder="https://... (ngang 1920×1080, lấy từ TMDB hoặc nguồn chất lượng cao)"
            />
            {errors.backdrop && <ErrorMsg msg={errors.backdrop.message} />}
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
                Ngày ra mắt <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("releaseDate", { required: "Vui lòng chọn ngày ra mắt" })}
                className={inputClass(errors.releaseDate)}
              />
              {errors.releaseDate && <ErrorMsg msg={errors.releaseDate.message} />}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Ngày kết thúc chiếu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("screeningEndDate", { required: "Vui lòng chọn ngày kết thúc" })}
                className={inputClass(errors.screeningEndDate)}
              />
              {errors.screeningEndDate && <ErrorMsg msg={errors.screeningEndDate.message} />}
              <p className="text-[11px] text-slate-400 mt-1 ml-1">Sau ngày này phim tự động chuyển sang <span className="font-bold">Ngừng chiếu</span></p>
            </div>
          </div>
          {preview && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Trạng thái
              </label>
              <div className={`rounded-xl p-3 border ${preview.bg} flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 duration-500`}>
                <span className={`w-2.5 h-2.5 rounded-full ${preview.dot}`} />
                <span className={`text-sm font-black ${preview.color}`}>{preview.label}</span>
                <span className="text-[11px] text-slate-400 font-medium ml-auto">Tự động xác định theo ngày</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                Ngôn ngữ
              </label>
              <input
                {...register("language")}
                className={inputClass(false)}
                placeholder="VD: Tiếng Việt, Phụ đề Việt..."
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Trailer YouTube URL
            </label>
            <input
              {...register("trailer")}
              className={inputClass(false)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-[11px] text-slate-400 mt-1 ml-1">Dán link YouTube — trailer sẽ hiển thị trên trang chi tiết phim</p>
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

const MOVIES_PAGE_SIZE = 6;

export const MoviesManager = ({
  movies,
  handleAddNew,
  handleEdit,
}) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [detailMovie, setDetailMovie] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const genreOptions = Array.from(new Set(
    movies.flatMap((m) =>
      Array.isArray(m.genre)
        ? m.genre.map((g) => (typeof g === "object" ? g.name : g))
        : m.genre ? [m.genre] : []
    ).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));

  const filteredMovies = movies.filter((movie) => {
    const genreNames = Array.isArray(movie.genre)
      ? movie.genre.map((g) => (typeof g === "object" ? g.name : g))
      : movie.genre ? [movie.genre] : [];
    return (
      (!filterStatus || movie.status === filterStatus) &&
      (!filterGenre || genreNames.includes(filterGenre)) &&
      (!search.trim() || movie.title?.toLowerCase().includes(search.trim().toLowerCase()))
    );
  });

  const MOVIES_PAGE_SIZE = 6;
  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PAGE_SIZE);
  const pagedMovies = filteredMovies.slice((currentPage - 1) * MOVIES_PAGE_SIZE, currentPage * MOVIES_PAGE_SIZE);

  const handleSearch = (val) => { setSearch(val); setCurrentPage(1); };
  const handleFilterStatus = (val) => { setFilterStatus(val); setCurrentPage(1); };
  const handleFilterGenre = (val) => { setFilterGenre(val); setCurrentPage(1); };

  return (
  <>
  <style>{`
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes dropDown {
      from { opacity: 0; transform: translateY(-6px) scaleY(0.95); }
      to   { opacity: 1; transform: translateY(0) scaleY(1); }
    }
    @keyframes rowIn {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `}</style>
  <div className="space-y-4">
    {/* Header bar */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Quản lý Phim</h2>
        <p className="text-sm text-slate-500">Quản lý toàn bộ danh sách phim</p>
      </div>
      <button
        onClick={handleAddNew}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 shrink-0"
      >
        <Plus size={18} /> Thêm phim mới
      </button>
    </div>

    {/* Search + Filter row */}
    <div className="flex gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Tìm theo tên phim..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#dc2626]"
        />
      </div>
      <div className="relative">
        <select
          value={filterGenre}
          onChange={(e) => handleFilterGenre(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#dc2626] appearance-none"
        >
          <option value="">Tất cả thể loại</option>
          {genreOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
      </div>
      <div className="relative">
        <select
          value={filterStatus}
          onChange={(e) => handleFilterStatus(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#dc2626] appearance-none"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="now_showing">Đang chiếu</option>
          <option value="coming_soon">Sắp chiếu</option>
          <option value="stopped">Ngừng chiếu</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
      </div>
    </div>

    {/* Table */}
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[13px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-5 pl-6">Tên phim</th>
              <th className="p-5">Thể loại</th>
              <th className="p-5">Thời lượng</th>
              <th className="p-5">Đánh giá</th>
              <th className="p-5 text-center">Trạng thái</th>
              <th className="p-5 pr-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody key={currentPage} className="divide-y divide-slate-100">
            {pagedMovies.length > 0 ? pagedMovies.map((movie, idx) => {
              const genreText = Array.isArray(movie.genre)
                ? movie.genre.map((g) => (typeof g === "object" ? g.name : g)).join(", ")
                : movie.genre || "—";
              const STATUS_MAP = {
                now_showing: { label: "Đang chiếu", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", dot: "bg-emerald-500 animate-pulse" },
                coming_soon: { label: "Sắp chiếu",  bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100",   dot: "bg-amber-500" },
                stopped:     { label: "Ngừng chiếu",bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400" },
              };
              const sc = STATUS_MAP[movie.status] || STATUS_MAP.coming_soon;
              return (
                <tr
                  key={movie._id}
                  onClick={() => setDetailMovie(movie)}
                  className="hover:bg-slate-50/80 transition-all duration-150 cursor-pointer"
                  style={{ animation: "rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${idx * 40}ms` }}
                >
                  <td className="p-5 pl-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={movie.poster}
                        alt=""
                        className="w-14 h-[76px] object-cover rounded-xl border border-slate-100 shrink-0"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <div>
                        <p className="font-bold text-slate-800 text-[16px] line-clamp-1">{movie.title}</p>
                        <p className="text-[13px] text-slate-400 font-mono mt-0.5">#{movie._id?.toString().slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-[15px] text-slate-600">{genreText}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-1.5 text-[15px] text-slate-500">
                      <Clock size={14} className="text-slate-400" /> {movie.duration} phút
                    </div>
                  </td>
                  <td className="p-5">
                    {movie.rating ? (
                      <div className="flex items-center gap-1 text-[15px] font-bold text-amber-500">
                        <Star size={14} fill="currentColor" /> {movie.rating}
                      </div>
                    ) : <span className="text-slate-300 text-[15px]">—</span>}
                  </td>
                  <td className="p-5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                      <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="p-5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetailMovie(movie)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Xem"><Eye size={18} /></button>
                      <button onClick={() => handleEdit(movie)} className="p-2 text-slate-400 hover:text-[#dc2626] hover:bg-red-50 rounded-xl transition-all" title="Sửa"><Edit size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="7" className="p-12 text-center text-slate-400 italic">
                {search || filterStatus || filterGenre ? "Không có phim nào phù hợp." : "Chưa có dữ liệu phim nào."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — always visible */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
        <p className="text-[15px] text-slate-500">
          Hiển thị <span className="font-bold text-slate-700">
            {filteredMovies.length === 0 ? 0 : (currentPage - 1) * MOVIES_PAGE_SIZE + 1}–{Math.min(currentPage * MOVIES_PAGE_SIZE, filteredMovies.length)}
          </span> / <span className="font-bold text-slate-700">{filteredMovies.length}</span> phim
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95">
            ‹ Trước
          </button>
          {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
            .map((p, i) => p === "..." ? (
              <span key={`d${i}`} className="px-2 text-slate-400 text-[15px]">…</span>
            ) : (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-10 h-10 rounded-lg text-[15px] font-bold transition-all duration-150 active:scale-95 ${currentPage === p ? "bg-[#dc2626] text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {p}
              </button>
            ))}
          <button onClick={() => setCurrentPage((p) => Math.min(Math.max(totalPages, 1), p + 1))} disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95">
            Sau ›
          </button>
        </div>
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
