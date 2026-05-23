import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Hero from "../../components/common/Hero";
import Footer from "../../components/common/Footer";
import MovieCard from "../../components/movie/MovieCard";
import axiosInstance from "../../api/axiosConfig";
import { NEWS_LIST } from "../../data/newsData";

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("now");
  const [visibleCount, setVisibleCount] = useState(10);

  const newsScrollRef = useRef(null);
  const animationRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    axiosInstance
      .get("/movies")
      .then((res) => setMovies(res.data))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  const nowShowingMovies = movies.filter((m) => m.status === "now_showing");
  const comingSoonMovies = movies.filter((m) => m.status === "coming_soon");

  const smoothScrollTo = (element, target, duration) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const start = element.scrollLeft;
    const change = target - start;
    const startTime = performance.now();
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      if (elapsed < duration) {
        const t = elapsed / duration;
        const easeOut = 1 - Math.pow(1 - t, 3);
        element.scrollLeft = start + change * easeOut;
        animationRef.current = requestAnimationFrame(animateScroll);
      } else {
        element.scrollLeft = target;
        animationRef.current = null;
      }
    };
    animationRef.current = requestAnimationFrame(animateScroll);
  };

  const scrollNews = (direction) => {
    const container = newsScrollRef.current;
    if (container) {
      const firstCard = container.firstElementChild;
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 24;
        const scrollAmount = cardWidth + gap;
        const target =
          direction === "left"
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;
        smoothScrollTo(container, target, 600);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsDragging(true);
    setStartX(e.pageX - newsScrollRef.current.offsetLeft);
    setScrollLeft(newsScrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - newsScrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    newsScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const currentMovies = activeTab === "now" ? nowShowingMovies : comingSoonMovies;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisibleCount(10);
  };

  const handleLoadMore = () => setVisibleCount((prev) => prev + 5);


  return (
    <div className="min-h-screen bg-white font-bromega font-bold text-gray-900">
      <Navbar />
      <Hero movies={nowShowingMovies} />

      <main className="container mx-auto px-4 sm:px-6 py-12 max-w-7xl">
        <div className="flex flex-col items-start mb-8 gap-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 border-l-4 border-red-600 pl-4 uppercase tracking-wide">
            {activeTab === "now" ? "Phim Đang Chiếu" : "Phim Sắp Chiếu"}
          </h2>
          <div className="relative flex bg-gray-100 p-1 rounded-xl w-fit">
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] bg-red-600 rounded-lg shadow-md transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${activeTab === "coming" ? "translate-x-full" : "translate-x-0"}`}
            ></div>
            <button
              onClick={() => handleTabChange("now")}
              className={`relative z-10 flex-1 px-4 py-2 text-sm font-bold whitespace-nowrap min-w-[120px] transition-colors duration-300 ${activeTab === "now" ? "text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              Đang Chiếu
            </button>
            <button
              onClick={() => handleTabChange("coming")}
              className={`relative z-10 flex-1 px-4 py-2 text-sm font-bold whitespace-nowrap min-w-[120px] transition-colors duration-300 ${activeTab === "coming" ? "text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              Sắp Chiếu
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-gray-200"></div>
                <div className="mt-3 h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : currentMovies.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold text-lg">
            Hiện chưa có phim trong mục này.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {currentMovies.slice(0, visibleCount).map((movie) => (
              <MovieCard key={movie._id || movie.id} movie={movie} />
            ))}
          </div>
        )}

        {!loading && visibleCount < currentMovies.length && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-[#dc2626] text-[#dc2626] font-bold rounded-2xl hover:bg-[#dc2626] hover:text-white transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-red-100"
            >
              <ChevronDown size={18} />
              Xem thêm ({currentMovies.length - visibleCount} phim còn lại)
            </button>
          </div>
        )}
      </main>

      <section className="bg-gray-50 py-12 border-t border-gray-100 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide border-l-4 border-red-600 pl-4">
              Tin Bên Lề
            </h2>
          </div>

          <div className="relative group">
            <button
              onClick={() => scrollNews("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 -ml-2 md:-ml-5 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-red-600 hover:text-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 duration-300"
            >
              <ChevronLeft size={24} />
            </button>

            <div
              ref={newsScrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`flex gap-6 overflow-x-auto pb-4 px-2 hide-scrollbar ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {NEWS_LIST.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  onDragStart={(e) => e.preventDefault()}
                  className="min-w-[300px] md:min-w-[380px] bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group/card border border-gray-100 block"
                >
                  <div className="h-48 overflow-hidden pointer-events-none">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{item.category}</span>
                    <h3 className="font-bold text-gray-800 mt-1 mb-3 text-base line-clamp-2 group-hover/card:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-bold">{item.timeAgo}</p>
                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => scrollNews("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 -mr-2 md:-mr-5 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-red-600 hover:text-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 duration-300"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
