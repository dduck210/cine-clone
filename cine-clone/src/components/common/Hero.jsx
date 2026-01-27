import React, { useState } from "react";
import { Play, Calendar, Star, Ticket, X } from "lucide-react";

const Hero = () => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const trailerVideoId = "GYkBA16qTLI";

  return (
    <>
      <div className="relative w-full h-[500px] md:h-[650px] overflow-hidden group">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000&auto=format&fit=crop"
            alt="Banner Background"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        </div>

        <div className="container mx-auto h-full flex items-center px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-sm font-bromega font-bold tracking-wide uppercase backdrop-blur-sm animate-fade-in-up">
              <Star size={14} fill="currentColor" /> Sự kiện hot tháng này
            </div>

            <h1 className="font-bromega font-black text-5xl md:text-7xl text-white leading-tight tracking-tight drop-shadow-2xl">
              Ưu Đãi Đặc Biệt <br />
              <span className="font-bromega font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 tracking-wide">
                Ngày Tình Yêu
              </span>
            </h1>

            <p className="font-bromega text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed">
              Trải nghiệm điện ảnh đỉnh cao với combo vé đôi giảm giá đến{" "}
              <span className="text-white font-bold">50%</span>.
              <br />
              Không gian lãng mạn, bắp nước thả ga.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bromega font-extrabold py-4 px-8 rounded-xl shadow-[0_10px_30px_rgba(220,38,38,0.4)] transition-all transform hover:-translate-y-1">
                <Ticket size={20} />
                ĐẶT VÉ NGAY
              </button>

              <button
                onClick={() => setIsTrailerOpen(true)}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bromega font-bold py-4 px-8 rounded-xl backdrop-blur-md transition-all cursor-pointer group/play"
              >
                <div className="w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center group-hover/play:scale-110 transition-transform">
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                </div>
                Xem Trailer
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400 pt-4 border-t border-gray-700/50 mt-8 w-fit font-bromega font-normal">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-orange-500" />
                Áp dụng: 13/02 - 15/02
              </div>

              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>

              <div>Chỉ tại rạp 5Cine</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {isTrailerOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-8">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-fade-in"
            onClick={() => setIsTrailerOpen(false)}
          ></div>

          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 animate-scale-up">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors backdrop-blur-sm"
            >
              <X size={24} />
            </button>

            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&rel=0`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;
