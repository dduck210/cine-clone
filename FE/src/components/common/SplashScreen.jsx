import React, { useEffect, useState } from "react";
import { Ticket } from "lucide-react";

const SplashScreen = ({ onDone }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1200);
    const doneTimer = setTimeout(() => onDone(), 1500);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a0a0a] transition-opacity duration-500"
      style={{ opacity: fading ? 0 : 1 }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-red-900/20 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative flex flex-col items-center gap-4 animate-[fadeScaleIn_0.6s_ease_forwards]">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-600/20 blur-xl scale-150" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-2xl shadow-red-900/50">
            <Ticket size={40} className="text-white" strokeWidth={2} />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-5xl font-black text-white tracking-tight">
            5<span className="text-[#dc2626]">Cine</span>
          </h1>
          <p
            className="text-gray-400 text-sm mt-2 font-medium animate-[fadeIn_0.6s_ease_0.4s_forwards] opacity-0"
          >
            Điểm đến cuối cùng của tín đồ điện ảnh
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-16 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#dc2626]"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
