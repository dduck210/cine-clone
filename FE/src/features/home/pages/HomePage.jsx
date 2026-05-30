import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronDown, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Navbar from "@/shared/components/common/Navbar";
import Hero from "@/shared/components/common/Hero";
import Footer from "@/shared/components/common/Footer";
import FeaturesStrip from "@/features/home/components/FeaturesStrip";
import MovieCard from "@/shared/components/movie/MovieCard";
import { getMovies } from "@/api/services/movie-service";
import { NEWS_LIST } from "@/features/news/data/news-data";
import useInView from "@/shared/hooks/use-in-view";

const SectionHeading = ({ children, action }) => {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={`flex items-center justify-between mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide relative pl-5 before:absolute before:left-0 before:top-[4px] before:bottom-[4px] before:w-[4px] before:rounded-full before:bg-red-600">{children}</h2>
      {action}
    </div>
  );
};

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("now");
  const [visibleCount, setVisibleCount] = useState(10);

  const newsScrollRef = useRef(null);
  const animationRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [movieSectionRef, movieSectionVisible] = useInView(0.05);
  const [newsSectionRef, newsSectionVisible] = useInView(0.05);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const moviesData = await getMovies();
        setMovies(moviesData);
      } catch (err) {
        console.error("Home fetch failed:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");
  const currentMovies = activeTab === "now" ? nowShowing : comingSoon;

  const smoothScrollTo = (element, target, duration) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const start = element.scrollLeft;
    const change = target - start;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      if (elapsed < duration) {
        element.scrollLeft = start + change * (1 - Math.pow(1 - elapsed / duration, 3));
        animationRef.current = requestAnimationFrame(animate);
      } else {
        element.scrollLeft = target;
        animationRef.current = null;
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  const scrollNews = (dir) => {
    const c = newsScrollRef.current;
    if (!c) return;
    const cardW = c.firstElementChild?.offsetWidth || 320;
    smoothScrollTo(c, dir === "left" ? c.scrollLeft - (cardW + 24) : c.scrollLeft + (cardW + 24), 600);
  };

  const handleMouseDown = (e) => {
    if (animationRef.current) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
    setIsDragging(true);
    setStartX(e.pageX - newsScrollRef.current.offsetLeft);
    setScrollLeft(newsScrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    newsScrollRef.current.scrollLeft = scrollLeft - (e.pageX - newsScrollRef.current.offsetLeft - startX) * 1.5;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-bromega font-bold text-gray-900 dark:text-gray-100">
      <Helmet>
        <title>5Cine — Đặt vé xem phim online nhanh nhất</title>
        <meta name="description" content="Đặt vé xem phim online tại 5Cine. Chọn phim, chọn ghế, thanh toán dễ dàng." />
        <meta property="og:title" content="5Cine — Đặt vé xem phim online" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />
      <Hero movies={nowShowing} />
      <FeaturesStrip />

      <main className="container mx-auto px-4 sm:px-6 py-14 max-w-7xl">
        <SectionHeading action={
          <Link to="/movies" className="hidden sm:flex items-center gap-1.5 text-sm text-red-600 font-bold hover:gap-3 transition-all duration-200">Xem tất cả <ArrowRight size={15} /></Link>
        }>
          {activeTab === "now" ? "Phim Đang Chiếu" : "Phim Sắp Chiếu"}
        </SectionHeading>

        <div ref={movieSectionRef} className={`mb-8 transition-all duration-700 delay-100 ${movieSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          <div className="relative flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] bg-red-600 rounded-lg shadow-md transition-all duration-400 ease-in-out ${activeTab === "coming" ? "translate-x-full" : "translate-x-0"}`} />
            {[["now", "Đang Chiếu"], ["coming", "Sắp Chiếu"]].map(([key, label]) => (
              <button key={key} onClick={() => { setActiveTab(key); setVisibleCount(10); }}
                className={`relative z-10 px-5 py-2.5 text-sm font-bold min-w-[120px] transition-colors duration-300 ${activeTab === key ? "text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse"><div className="aspect-[2/3] rounded-2xl bg-gray-200 dark:bg-gray-800" /><div className="mt-3 h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" /></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-50 dark:bg-red-900/10 rounded-3xl border-2 border-dashed border-red-200 dark:border-red-800/50 px-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Kết nối API thất bại</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">Hệ thống không thể tải dữ liệu phim. Vui lòng kiểm tra xem server có đang hoạt động không.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all active:scale-95">Thử lại ngay</button>
          </div>
        ) : currentMovies.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold text-lg">Hiện chưa có phim trong mục này.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {currentMovies.slice(0, visibleCount).map((movie, i) => (
              <div key={movie._id || movie.id} className="opacity-0 animate-[fadeUp_0.5s_ease_forwards]" style={{ animationDelay: `${(i % 5) * 60}ms` }}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}

        {!loading && visibleCount < currentMovies.length && (
          <div className="mt-10 flex justify-center">
            <button onClick={() => setVisibleCount((p) => p + 5)}
              className="flex items-center gap-2 px-8 py-3.5 bg-white dark:bg-transparent border-2 border-red-600 text-red-600 font-bold rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-red-100 dark:hover:shadow-red-900/20 group">
              <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
              Xem thêm ({currentMovies.length - visibleCount} phim còn lại)
            </button>
          </div>
        )}
      </main>

      <section ref={newsSectionRef} className={`bg-gray-50 dark:bg-gray-900 py-14 border-t border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-700 ${newsSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeading>Tin Bên Lề</SectionHeading>
          <div className="relative group/news">
            <button onClick={() => scrollNews("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -ml-2 md:-ml-5 w-11 h-11 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-red-600 hover:text-white hover:border-transparent hover:scale-110 transition-all opacity-0 group-hover/news:opacity-100 duration-300">
              <ChevronLeft size={22} />
            </button>
            <div ref={newsScrollRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}
              className={`flex gap-6 overflow-x-auto pb-4 px-2 hide-scrollbar ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`} style={{ scrollbarWidth: "none" }}>
              {NEWS_LIST.map((item) => (
                <Link key={item.id} to={`/news/${item.id}`} onDragStart={(e) => e.preventDefault()}
                  className="w-[300px] md:w-[360px] flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-gray-900/50 transition-all duration-300 group/card border border-gray-100 dark:border-gray-700 hover:-translate-y-1">
                  <div className="h-48 flex-shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">{item.category}</span>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mt-1.5 mb-3 text-[15px] line-clamp-2 group-hover/card:text-red-600 transition-colors leading-snug flex-1">{item.title}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" />{item.timeAgo}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <button onClick={() => scrollNews("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 -mr-2 md:-mr-5 w-11 h-11 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-red-600 hover:text-white hover:border-transparent hover:scale-110 transition-all opacity-0 group-hover/news:opacity-100 duration-300">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default HomePage;
