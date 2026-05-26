import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, Ticket, ChevronLeft, ChevronRight, Play } from "lucide-react";

const SLIDE_MS = 5000;

const Hero = ({ movies = [] }) => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const slides = movies.filter((m) => m.poster).slice(0, 8);

  const goTo = useCallback((i) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setCurrent(i);
    setProgress(0);
  }, []);

  useEffect(() => { setCurrent(0); setProgress(0); }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    startRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - startRef.current;
      const pct = Math.min((elapsed / SLIDE_MS) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setCurrent((c) => (c + 1) % slides.length);
        setProgress(0);
        startRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [current, paused, slides.length]);

  if (slides.length === 0) {
    return <div className="mt-16 md:mt-20 h-[480px] bg-gray-900" />;
  }

  const movie = slides[current];

  return (
    <section
      className="group/hero relative w-full mt-16 md:mt-20 overflow-hidden"
      style={{ height: "clamp(480px, 62vh, 680px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background slides (crossfade + ken burns) */}
      {slides.map((m, i) => (
        <div
          key={m._id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <img
            src={m.backdrop || m.poster}
            alt={m.title}
            className="w-full h-full object-cover object-center"
            style={{
              filter: m.backdrop ? "brightness(0.85)" : "blur(8px) saturate(1.2) brightness(0.7)",
              transform: i === current ? "scale(1.05)" : "scale(1)",
              transition: "transform 10s ease-out",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>
      ))}

      {/* Prev arrow */}
      {slides.length > 1 && (
        <button
          onClick={() => goTo((current - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 hover:bg-red-600 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover/hero:opacity-100 hover:scale-110 hover:border-transparent"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next arrow */}
      {slides.length > 1 && (
        <button
          onClick={() => goTo((current + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/30 hover:bg-red-600 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover/hero:opacity-100 hover:scale-110 hover:border-transparent"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex items-end sm:items-center pb-20 sm:pb-0">
        <div className="w-full px-5 sm:px-10 lg:px-16 max-w-screen-xl mx-auto">
          <div className="max-w-[480px] lg:max-w-[520px] space-y-2.5 sm:space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {movie.ageRestriction && (
                <span className="bg-red-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded shadow-sm">
                  {movie.ageRestriction}
                </span>
              )}
              {movie.rating > 0 && (
                <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded backdrop-blur-sm">
                  <Star size={10} fill="currentColor" /> {movie.rating}
                </span>
              )}
              {movie.duration > 0 && (
                <span className="flex items-center gap-1 bg-white/10 text-white/70 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded backdrop-blur-sm">
                  <Clock size={10} /> {movie.duration} phút
                </span>
              )}
            </div>

            <h1 className="font-sans font-black text-2xl sm:text-4xl md:text-5xl lg:text-5xl text-white leading-[1.1] md:leading-[1.05] drop-shadow-2xl line-clamp-2 md:line-clamp-3">
              {movie.title}
            </h1>

            {Array.isArray(movie.genre) && movie.genre.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genre.slice(0, 3).map((g, i) => (
                  <span key={i} className="text-[10px] sm:text-xs text-white/60 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                    {typeof g === "string" ? g : g.name}
                  </span>
                ))}
              </div>
            )}

            {movie.description && (
              <p className="hidden sm:block text-sm lg:text-base text-gray-300/80 leading-relaxed line-clamp-4 lg:line-clamp-5">
                {movie.description}
              </p>
            )}

            <div className="pt-1 sm:pt-2 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate(`/movie/${movie._id}`)}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-900/40 transition-all text-sm"
              >
                <Ticket size={16} /> Đặt Vé Ngay
              </button>
              <button
                onClick={() => navigate(`/movie/${movie._id}`)}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 hover:border-white/40 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm"
              >
                <Play size={13} fill="currentColor" /> Chi tiết
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: progress bar + dots */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="h-[2px] bg-white/10">
          <div className="h-full bg-red-500" style={{ width: `${progress}%`, transition: "none" }} />
        </div>
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 py-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current ? "w-6 h-2 bg-red-500" : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;
