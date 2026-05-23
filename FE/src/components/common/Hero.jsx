import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, Ticket } from "lucide-react";

const Hero = ({ movies = [] }) => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = movies.filter((m) => m.poster).slice(0, 8);

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(goNext, 3000);
    return () => clearInterval(timer);
  }, [goNext, paused, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="mt-16 md:mt-20 h-[480px] sm:h-[560px] md:h-[620px] bg-gray-900" />
    );
  }

  const movie = slides[current];

  return (
    <section
      className="relative w-full mt-16 md:mt-20 overflow-hidden"
      style={{ height: "clamp(480px, 62vh, 660px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background slides (crossfade) */}
      {slides.map((m, i) => (
        <div
          key={m._id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 1 : 0,
          }}
        >
          <img
            src={m.backdrop || m.poster}
            alt={m.title}
            className="w-full h-full object-cover object-center"
            style={{ filter: m.backdrop ? "none" : "blur(3px)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-end sm:items-center pb-16 sm:pb-0">
        <div className="w-full px-5 sm:px-10 lg:px-16 max-w-screen-xl mx-auto">
          <div className="max-w-xl lg:max-w-2xl space-y-3 sm:space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {movie.ageRestriction && (
                <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded">
                  {movie.ageRestriction}
                </span>
              )}
              {movie.rating > 0 && (
                <span className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold px-2.5 py-0.5 rounded">
                  <Star size={10} fill="currentColor" /> {movie.rating}
                </span>
              )}
              {movie.duration > 0 && (
                <span className="flex items-center gap-1 bg-white/10 text-white/60 text-xs font-bold px-2.5 py-0.5 rounded">
                  <Clock size={10} /> {movie.duration} phút
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-sans font-black text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight drop-shadow-xl line-clamp-2">
              {movie.title}
            </h1>

            {/* Genres */}
            {Array.isArray(movie.genre) && movie.genre.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genre.slice(0, 4).map((g, i) => (
                  <span
                    key={i}
                    className="text-xs text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full"
                  >
                    {typeof g === "string" ? g : g.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description — hidden on very small screens */}
            {movie.description && (
              <p className="hidden sm:block text-sm md:text-base text-gray-300 leading-relaxed line-clamp-2 md:line-clamp-3 opacity-90 max-w-lg">
                {movie.description}
              </p>
            )}

            {/* CTA button */}
            <div className="pt-1 sm:pt-2">
              <button
                onClick={() => navigate(`/movie/${movie._id}`)}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-lg transition-all text-sm whitespace-nowrap"
              >
                <Ticket size={16} /> Đặt Vé Ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-red-500"
                  : "w-2 h-2 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
