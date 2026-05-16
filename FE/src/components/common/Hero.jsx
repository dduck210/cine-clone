import React, { useState, useRef } from "react";
import { Play, Calendar, Star, Ticket, X, RotateCw } from "lucide-react";

const Hero = () => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const trailerVideoId = "GYkBA16qTLI";
  const modalRef = useRef(null);

  const openTrailer = async () => {
    setIsTrailerOpen(true);
    setTimeout(async () => {
      if (modalRef.current && window.innerWidth < 1024) {
        try {
          if (modalRef.current.requestFullscreen) {
            await modalRef.current.requestFullscreen();
          } else if (modalRef.current.webkitRequestFullscreen) {
            await modalRef.current.webkitRequestFullscreen();
          }
          if (window.screen.orientation && window.screen.orientation.lock) {
            await window.screen.orientation
              .lock("landscape-primary")
              .catch(() => {});
          }
        } catch {
          console.warn("Tính năng tự động xoay bị hạn chế.");
        }
      }
    }, 200);
  };

  const closeTrailer = () => {
    setIsTrailerOpen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <>
      <section className="relative w-full h-auto min-h-[580px] md:h-[650px] overflow-hidden group flex items-center mt-16 md:mt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000&auto=format&fit=crop"
            alt="Cinema Banner"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black md:bg-gradient-to-r md:from-gray-900 md:via-gray-900/80 md:to-transparent" />
        </div>

        <div className="container mx-auto px-6 sm:px-10 relative z-10 py-20 md:py-0">
          <div className="max-w-3xl space-y-5 md:space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] md:text-sm font-sans font-bold tracking-widest uppercase backdrop-blur-md">
              <Star size={14} fill="currentColor" /> Sự kiện hot tháng này
            </div>

            <h1 className="font-sans font-black text-3xl sm:text-5xl md:text-7xl text-white leading-[1.1] tracking-tight drop-shadow-2xl flex flex-col gap-1 md:gap-3">
              <span>Ưu Đãi Đặc Biệt</span>
              <span className="font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 tracking-wide">
                Ngày Tình Yêu
              </span>
            </h1>

            <p className="font-sans text-sm md:text-xl text-gray-300 max-w-xl leading-relaxed opacity-90">
              Trải nghiệm điện ảnh đỉnh cao với combo vé đôi giảm giá đến{" "}
              <strong className="text-white text-lg md:text-2xl font-black">
                50%
              </strong>
              .
              <span className="hidden md:inline">
                {" "}
                Không gian lãng mạn, bắp nước thả ga.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 w-full sm:w-auto">
              <button className="w-full sm:w-auto h-[56px] flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-sans font-extrabold px-10 rounded-2xl shadow-lg transition-all active:scale-95 text-sm md:text-base whitespace-nowrap">
                <Ticket size={20} className="shrink-0" />
                <span>ĐẶT VÉ NGAY</span>
              </button>

              <button
                onClick={openTrailer}
                className="w-full sm:w-auto h-[56px] flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans font-bold px-10 rounded-2xl backdrop-blur-xl transition-all active:scale-95 group/play text-sm md:text-base whitespace-nowrap"
              >
                <div className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center shrink-0 shadow-lg">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </div>
                <span>Xem Trailer</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] md:text-sm text-gray-400 pt-8 border-t border-white/10 mt-10 w-fit font-sans">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-orange-500" />
                Áp dụng: 13/02 - 15/02
              </div>
              <span className="hidden sm:block w-1.5 h-1.5 bg-white/20 rounded-full" />
              <div className="font-medium">Độc quyền tại rạp 5Cine</div>
            </div>
          </div>
        </div>
      </section>

      {isTrailerOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-10 bg-black/95 backdrop-blur-2xl">
          <div
            className="absolute inset-0 cursor-zoom-out"
            onClick={closeTrailer}
          />
          <div
            ref={modalRef}
            className="relative w-full h-full md:h-auto md:max-w-5xl md:aspect-video bg-black md:rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center"
          >
            <div className="lg:hidden absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/40 text-[10px] animate-pulse pointer-events-none z-30">
              <RotateCw size={12} /> Xoay ngang điện thoại để xem tốt nhất
            </div>
            <button
              onClick={closeTrailer}
              className="absolute top-5 right-5 z-40 p-3 bg-black/50 hover:bg-red-600 rounded-full text-white backdrop-blur-md"
            >
              <X size={24} />
            </button>
            <iframe
              className="w-full h-full z-10"
              src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&rel=0`}
              title="Trailer"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;
