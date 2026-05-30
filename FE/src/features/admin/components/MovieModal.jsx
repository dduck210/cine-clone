import React, { useState, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  X, Eye, ChevronDown, Save,
} from "lucide-react";

export const ErrorMsg = ({ msg }) => (
  <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p>
);

const MovieModal = ({ currentMovie, setIsModalOpen, handleSave, genreOptions = [] }) => {
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
    `w-full bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 outline-none transition-all duration-300 font-medium text-slate-700 dark:text-white ${
      error
        ? "border-red-500 bg-red-50 focus:ring-4 focus:ring-red-100 placeholder-red-300 animate-shake"
        : "border-slate-200 dark:border-gray-600 focus:border-[#dc2626] focus:bg-white dark:focus:bg-gray-600 focus:ring-4 focus:ring-red-50 hover:border-slate-300 dark:hover:border-gray-500"
    }`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsModalOpen(false)}
      ></div>
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-gray-700"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">
              {currentMovie ? "Chỉnh sửa Phim" : "Thêm Phim Mới"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Vui lòng nhập đầy đủ thông tin</p>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200 transition-all"
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
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
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
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Thể loại <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setGenreDropdownOpen((o) => !o)}
                className={`w-full bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-left font-medium transition-all flex items-center justify-between ${
                  selectedGenres.length === 0 ? "text-slate-400 dark:text-gray-500" : "text-slate-700 dark:text-white"
                } ${genreDropdownOpen ? "border-[#dc2626] ring-4 ring-red-50" : "border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500"}`}
              >
                <span className="truncate text-sm">
                  {selectedGenreNames.length > 0 ? selectedGenreNames.join(", ") : "Chọn thể loại..."}
                </span>
                <ChevronDown size={16} className={`shrink-0 ml-2 text-slate-400 transition-transform ${genreDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {genreDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                  style={{ animation: "dropDown 0.18s ease-out both", transformOrigin: "top" }}>
                  {genreOptions.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-gray-500 text-center py-4">Không có thể loại nào</p>
                  ) : (
                    genreOptions.map((g) => (
                      <label key={g._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(g._id)}
                          onChange={() => toggleGenre(g._id)}
                          className="w-4 h-4 accent-[#dc2626] rounded"
                        />
                        <span className="text-sm text-slate-700 dark:text-gray-300 font-medium">{g.name}</span>
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
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
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
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
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
              <div className="hidden sm:flex w-12 h-12 rounded-lg bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex-shrink-0 overflow-hidden items-center justify-center text-slate-300">
                <Eye size={20} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Banner ngang URL <span className="font-normal text-slate-400 dark:text-gray-500 normal-case">(ảnh 16:9 cho slider trang chủ)</span>
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
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Đạo diễn
              </label>
              <input
                {...register("director")}
                className={inputClass(false)}
                placeholder="Tên đạo diễn..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
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
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Ngày kết thúc chiếu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("screeningEndDate", { required: "Vui lòng chọn ngày kết thúc" })}
                className={inputClass(errors.screeningEndDate)}
              />
              {errors.screeningEndDate && <ErrorMsg msg={errors.screeningEndDate.message} />}
              <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1 ml-1">Sau ngày này phim tự động chuyển sang <span className="font-bold">Ngừng chiếu</span></p>
            </div>
          </div>
          {preview && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Trạng thái
              </label>
              <div className={`rounded-xl p-3 border ${preview.bg} flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 duration-500`}>
                <span className={`w-2.5 h-2.5 rounded-full ${preview.dot}`} />
                <span className={`text-sm font-black ${preview.color}`}>{preview.label}</span>
                <span className="text-[11px] text-slate-400 dark:text-gray-500 font-medium ml-auto">Tự động xác định theo ngày</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Diễn viên chính
              </label>
              <input
                {...register("cast")}
                className={inputClass(false)}
                placeholder="VD: Tom Hanks, Scarlett Johansson..."
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
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
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Trailer YouTube URL
            </label>
            <input
              {...register("trailer")}
              className={inputClass(false)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1 ml-1">Dán link YouTube — trailer sẽ hiển thị trên trang chi tiết phim</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
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
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Giới hạn tuổi
              </label>
              <div className="relative">
                <select
                  {...register("ageRestriction")}
                  className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 appearance-none font-medium text-slate-700 dark:text-white cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors"
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
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-50 dark:border-gray-700 mt-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl font-semibold transition-all text-sm"
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

export default MovieModal;
