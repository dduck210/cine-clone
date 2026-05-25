import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Tag, Clock, Search, Clapperboard, ArrowRight } from "lucide-react";
import { PROMOTIONS_LIST } from "../data/promotionsData";

const CATEGORIES = ["Tất cả", "Vé", "Combo", "Thành viên", "Sự kiện"];

function normalizeText(str) {
  return (str || "").toLowerCase().trim();
}

const PromotionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const filteredPromos = useMemo(() => {
    const normSearch = normalizeText(searchTerm);
    return PROMOTIONS_LIST.filter((promo) => {
      const matchesSearch =
        !normSearch ||
        normalizeText(promo.title).includes(normSearch) ||
        normalizeText(promo.desc).includes(normSearch);
      const matchesCategory =
        selectedCategory === "Tất cả" || promo.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      <Navbar />

      {/* ── HERO — matches CinemasPage exactly ── */}
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
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">Khuyến Mãi & Ưu Đãi</h1>
              <p className="text-slate-400 mt-2 max-w-md">Khám phá ưu đãi hấp dẫn dành cho khách hàng của 5Cine</p>
            </div>

            {/* Stats */}
            <div className="flex gap-3 shrink-0 opacity-0 animate-[fadeUp_0.6s_ease_0.25s_forwards]">
              <div className="text-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 hover:bg-white/15 transition-colors cursor-default">
                <p className="text-3xl font-black text-white">{PROMOTIONS_LIST.length}</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-widest">Khuyến mãi</p>
              </div>
            </div>
          </div>

          {/* Search & Filter — inside hero, matches CinemasPage */}
          <div className="opacity-0 animate-[fadeUp_0.5s_ease_0.3s_forwards] flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm khuyến mãi..."
                className="w-full pl-11 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-slate-400 font-medium text-sm outline-none focus:bg-white/15 focus:border-white/40 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative md:w-52">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select
                className="w-full pl-10 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-medium text-sm outline-none focus:bg-white/15 focus:border-white/40 transition-all cursor-pointer appearance-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#16213e] text-white">{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 pt-8 pb-20">
        {/* Grid */}
        {filteredPromos.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-bold text-lg">
              {searchTerm
                ? `Không tìm thấy khuyến mãi nào với từ khóa "${searchTerm}".`
                : selectedCategory !== "Tất cả"
                  ? `Không có khuyến mãi nào trong mục ${selectedCategory}.`
                  : "Hiện chưa có khuyến mãi nào."}
            </p>
            {(searchTerm || selectedCategory !== "Tất cả") && (
              <button
                onClick={() => { setSearchTerm(""); setSelectedCategory("Tất cả"); }}
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
                Hiển thị <span className="font-black text-gray-800">{filteredPromos.length}</span>
                /<span className="font-black text-gray-800">{PROMOTIONS_LIST.length}</span> khuyến mãi
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPromos.map((promo, i) => (
                <div
                  key={promo.id}
                  className="opacity-0 animate-[fadeUp_0.5s_ease_forwards]"
                  style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
                >
                  <Link
                    to={`/promotions/${promo.id}`}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full"
                  >
                    {/* Image Section — matches cinema card */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={promo.image}
                        alt={promo.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        onError={(e) => { e.target.src = "https://via.placeholder.com/800/400?text=5Cine"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                      {/* Tag badge */}
                      <div className="absolute top-4 left-4">
                        <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg tracking-wider shadow-lg">
                          {promo.tag}
                        </span>
                      </div>

                      {/* Title overlay — matches cinema card */}
                      <div className="absolute bottom-6 left-6 right-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-xl font-black mb-1 tracking-tight line-clamp-2">{promo.title}</h3>
                        <div className="flex items-center gap-1.5 text-white/80 text-sm font-medium">
                          <Clock size={14} className="text-red-400 shrink-0" />
                          <span>{promo.date}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section — matches cinema card */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="space-y-4 mb-6 flex-1">
                        <div className="flex items-start gap-3 text-gray-600">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Tag size={16} className="text-red-600" />
                          </div>
                          <p className="text-sm font-medium leading-relaxed line-clamp-2">{promo.desc}</p>
                        </div>
                      </div>

                      {/* CTA — matches cinema "Khám Phá Rạp" button */}
                      <div className="w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold hover:bg-red-600 transform active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gray-200 hover:shadow-red-200">
                        Xem chi tiết <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PromotionsPage;
