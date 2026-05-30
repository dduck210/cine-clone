import React from "react";
import { Link } from "react-router-dom";
import { Ticket, Home, Search } from "lucide-react";
import Navbar from "../components/common/Navbar";

const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-950 font-bromega flex flex-col">
    <Navbar />

    <main className="flex-1 flex items-center justify-center px-4 pt-20">
      <div className="text-center max-w-lg mx-auto">
        {/* Film reel decoration */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-[6px] border-gray-800 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-[4px] border-gray-700 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-gray-700" />
              </div>
            </div>
            {/* Sprocket holes */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute w-3 h-3 rounded-full bg-gray-800 border-2 border-gray-700"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-52px)`,
                }}
              />
            ))}
            <Ticket size={24} className="absolute inset-0 m-auto text-red-600" />
          </div>
        </div>

        {/* 404 */}
        <div className="mb-3">
          <span className="text-[96px] sm:text-[128px] font-black leading-none bg-gradient-to-b from-red-500 to-red-800 bg-clip-text text-transparent select-none">
            404
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white mb-3">
          Trang này không tồn tại
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mb-10 leading-relaxed">
          Có vẻ như đường link đã bị đứt hoặc trang bạn tìm đã bị xóa.
          <br />Đừng lo — hãy quay về trang chủ để tìm phim hay nhé.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/40"
          >
            <Home size={18} /> Về trang chủ
          </Link>
          <Link
            to="/movies"
            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all active:scale-95"
          >
            <Search size={18} /> Tìm phim
          </Link>
        </div>
      </div>
    </main>

    {/* Film strip bottom decoration */}
    <div className="h-8 flex items-center overflow-hidden opacity-20 mt-auto">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-8 h-6 border-r-2 border-gray-600 flex flex-col justify-between py-0.5">
          <div className="w-2 h-1.5 rounded-sm bg-gray-600 mx-auto" />
          <div className="w-2 h-1.5 rounded-sm bg-gray-600 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export default NotFoundPage;
