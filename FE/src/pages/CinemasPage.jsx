import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { MapPin, Phone, ArrowRight, Search, Navigation, Clapperboard, ChevronDown } from "lucide-react";
import axiosInstance from "../api/axiosConfig";

const cinemaFallback = (id) => `https://picsum.photos/seed/${id}/800/400`;

const PAGE_SIZE = 6;

function extractCity(address) {
  if (!address) return "";
  // Split by comma, take the last meaningful segment as city
  const parts = address.split(",").map((s) => s.trim());
  // Try to find a city-like segment (containing known city keywords)
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i].toLowerCase();
    if (p.includes("hà nội") || p.includes("hồ chí minh") || p.includes("đà nẵng")
      || p.includes("cần thơ") || p.includes("hải phòng") || p.includes("nha trang")
      || p.includes("huế") || p.includes("vũng tàu") || p.includes("đà lạt")
      || p.includes("biên hòa") || p.includes("quy nhơn") || p.includes("buôn ma thuột")
      || p.includes("thanh hóa") || p.includes("vinh") || p.includes("hạ long")
      || p.includes("bình dương") || p.includes("tây ninh") || p.includes("long an")) {
      return parts[i];
    }
  }
  // Fallback to last segment
  return parts[parts.length - 1] || address;
}

function normalizeText(str) {
  return (str || "").toLowerCase()
    .replace(/tp\.?\s*/gi, "")
    .replace(/thành phố\s*/gi, "")
    .replace(/tỉnh\s*/gi, "")
    .replace(/quận\s*/gi, "")
    .replace(/huyện\s*/gi, "")
    .trim();
}

const CinemasPage = () => {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tất cả");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    axiosInstance.get("/admin/cinemas").then((res) => setCinemas(res.data)).catch(() => setCinemas([])).finally(() => setLoading(false));
  }, []);

  // Extract cities dynamically from cinema data
  const cities = useMemo(() => {
    const set = new Set();
    set.add("Tất cả");
    cinemas.forEach((c) => {
      const city = extractCity(c.address);
      if (city) set.add(city);
    });
    return [...set];
  }, [cinemas]);

  const filteredCinemas = useMemo(() => {
    const normSearch = normalizeText(searchTerm);
    return cinemas.filter((cinema) => {
      const normName = normalizeText(cinema.name);
      const normAddr = normalizeText(cinema.address);
      const matchesSearch = !normSearch
        || normName.includes(normSearch)
        || normAddr.includes(normSearch);

      const city = extractCity(cinema.address);
      const matchesCity = selectedCity === "Tất cả"
        || normalizeText(city) === normalizeText(selectedCity)
        || normalizeText(cinema.address).includes(normalizeText(selectedCity));

      return matchesSearch && matchesCity;
    });
  }, [cinemas, searchTerm, selectedCity]);

  const displayCinemas = filteredCinemas.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCinemas.length;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      <Navbar />

      {/* ── HERO ── */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] pt-24 md:pt-32 pb-10 overflow-hidden">
        {/* Decorative background icons */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none select-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <Clapperboard key={i} size={120} className="absolute text-white"
              style={{ top: `${(i * 27) % 90}%`, left: `${(i * 31) % 95}%`, transform: `rotate(${i * 22}deg)` }}
            />
          ))}
        </div>
        {/* Radial glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-red-700/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative container mx-auto px-4 sm:px-6 opacity-0 animate-[fadeIn_0.7s_ease_forwards]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-2">5Cine</p>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">Hệ Thống Rạp</h1>
              <p className="text-slate-400 mt-2 max-w-md">Khám phá không gian điện ảnh đẳng cấp với hệ thống rạp hiện đại bậc nhất</p>
            </div>

            {/* Stats */}
            <div className="flex gap-3 shrink-0 opacity-0 animate-[fadeUp_0.6s_ease_0.25s_forwards]">
              <div className="text-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 hover:bg-white/15 transition-colors cursor-default">
                <p className="text-3xl font-black text-white">{cinemas.length}</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-widest">Rạp chiếu</p>
              </div>
            </div>
          </div>

          {/* Search & Filter — inside hero */}
          <div className="opacity-0 animate-[fadeUp_0.5s_ease_0.3s_forwards] flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm tên rạp hoặc địa chỉ..."
                className="w-full pl-11 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-slate-400 font-medium text-sm outline-none focus:bg-white/15 focus:border-white/40 transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(PAGE_SIZE); }}
              />
            </div>
            <div className="relative md:w-52">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select
                className="w-full pl-10 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-medium text-sm outline-none focus:bg-white/15 focus:border-white/40 transition-all cursor-pointer appearance-none"
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setVisibleCount(PAGE_SIZE); }}
              >
                {cities.map((city) => (
                  <option key={city} value={city} className="bg-[#16213e] text-white">{city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl h-[420px] animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredCinemas.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-bold text-lg">
              {searchTerm
                ? `Không tìm thấy rạp nào với từ khóa "${searchTerm}".`
                : selectedCity !== "Tất cả"
                  ? `Không có rạp nào tại ${selectedCity}.`
                  : "Hiện chưa có rạp chiếu nào."}
            </p>
            {(searchTerm || selectedCity !== "Tất cả") && (
              <button
                onClick={() => { setSearchTerm(""); setSelectedCity("Tất cả"); }}
                className="mt-4 text-sm text-red-600 font-bold hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-400 font-medium">
                Hiển thị <span className="font-black text-gray-800">{Math.min(visibleCount, filteredCinemas.length)}</span>
                /<span className="font-black text-gray-800">{filteredCinemas.length}</span> rạp
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayCinemas.map((cinema, i) => (
                <div
                  key={cinema._id}
                  className="opacity-0 animate-[fadeUp_0.5s_ease_forwards]"
                  style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full">
                    {/* Image Section */}
                    <div className="relative h-52 overflow-hidden bg-gray-900">
                      <img
                        src={cinema.image || cinemaFallback(cinema._id)}
                        alt={cinema.name}
                        onError={(e) => { e.target.src = cinemaFallback(cinema._id); }}
                        className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-110"
                      />
                      {/* Consistent dark gradient so text is always readable regardless of image brightness */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const q = encodeURIComponent(cinema.address);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
                          }}
                          className="p-2.5 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-red-600 rounded-full transition-all duration-300 shadow-lg"
                        >
                          <Navigation size={16} />
                        </button>
                      </div>

                      <div className="absolute bottom-5 left-5 right-14 text-white">
                        <h3 className="text-lg font-black mb-1 tracking-tight leading-snug line-clamp-2">{cinema.name}</h3>
                        <div className="flex items-center gap-1.5 text-white/75 text-xs font-medium">
                          <MapPin size={12} className="text-red-400 shrink-0" />
                          <span className="truncate">{extractCity(cinema.address)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="space-y-4 mb-6 flex-1">
                        <div className="flex items-start gap-3 text-gray-600">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin size={16} className="text-red-600" />
                          </div>
                          <p className="text-sm font-medium leading-relaxed line-clamp-2">{cinema.address}</p>
                        </div>

                        {cinema.phone && (
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                              <Phone size={16} className="text-green-600" />
                            </div>
                            <p className="text-sm font-bold tracking-wider">{cinema.phone}</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/cinemas/${cinema._id}`)}
                        className="w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold hover:bg-red-600 transform active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gray-200 hover:shadow-red-200"
                      >
                        Khám Phá Rạp <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="group flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-[#dc2626] text-[#dc2626] font-bold rounded-2xl hover:bg-[#dc2626] hover:text-white transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-red-100"
            >
              <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
              Xem thêm ({filteredCinemas.length - visibleCount} rạp còn lại)
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CinemasPage;
