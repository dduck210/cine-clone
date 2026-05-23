import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Clock, Ticket } from "lucide-react";

const Hero = ({ movies = [] }) => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = movies.filter((m) => m.poster).slice(0, 8);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(goNext, 4000);
    return () => clearInterval(timer);
  }, [goNext, paused, slides.length]);

  if (slides.length === 0) {
    return <div className="mt-16 md:mt-20 h-[560px] md:h-[620px] bg-gray-900" />;
  }

  const movie = slides[current];

  return (
    <section
      className="relative w-full mt-16 md:mt-20 overflow-hidden"
      style={{ height: "clamp(520px, 65vh, 680px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background slides (crossfade) */}
      {slides.map((m, i) => (
        <div
          key={m._id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <img
            src={m.backdrop || m.poster}
            alt={m.title}
            className="w-full h-full object-cover object-center"
            style={{ filter: m.backdrop ? "none" : "blur(3px)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full container mx-auto px-6 sm:px-10 max-w-7xl flex items-center">
        <div className="flex items-center gap-8 w-full">

          {/* Left: movie info */}
          <div className="flex-1 space-y-4 max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {movie.ageRestriction && (
                <span className="bg-red-600 text-white text-xs font-black px-2.5 py-0.5 rounded font-sans">
                  {movie.ageRestriction}
                </span>
              )}
              {movie.rating > 0 && (
                <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold px-2.5 py-0.5 rounded font-sans">
                  <Star size={11} fill="currentColor" /> {movie.rating}
                </span>
              )}
              {movie.duration > 0 && (
                <span className="flex items-center gap-1 bg-white/10 text-white/60 text-xs font-bold px-2.5 py-0.5 rounded font-sans">
                  <Clock size={11} /> {movie.duration} phút
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-sans font-black text-3xl sm:text-5xl md:text-6xl text-white leading-tight drop-shadow-2xl line-clamp-2">
              {movie.title}
            </h1>

            {/* Genres */}
            {Array.isArray(movie.genre) && movie.genre.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genre.slice(0, 4).map((g, i) => (
                  <span key={i} className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded-full font-sans font-medium">
                    {typeof g === "string" ? g : g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {movie.description && (
              <p className="font-sans text-sm md:text-base text-gray-300 max-w-lg leading-relaxed line-clamp-3 opacity-90">
                {movie.description}
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate(`/movie/${movie._id}`)}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-sans font-bold px-8 py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 text-sm whitespace-nowrap"
              >
                <Ticket size={18} /> Đặt Vé Ngay
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-red-600 rounded-full flex items-center justify-center text-white border border-white/20 backdrop-blur-sm transition-all duration-200"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-red-600 rounded-full flex items-center justify-center text-white border border-white/20 backdrop-blur-sm transition-all duration-200"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-7 h-2 bg-red-600"
                  : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
