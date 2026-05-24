import React from "react";
import { Link } from "react-router-dom";
import { Film, MapPin, Tag, Zap } from "lucide-react";
import useInView from "../../hooks/use-in-view";

const FEATURES = [
  { icon: <Film size={22} />, label: "50+ Phim mới", sub: "Cập nhật mỗi tuần", to: "/movies" },
  { icon: <MapPin size={22} />, label: "3 Rạp chiếu", sub: "Địa điểm thuận tiện", to: "/cinemas" },
  { icon: <Tag size={22} />, label: "Giảm 20% thứ Hai", sub: "Ưu đãi cố định mỗi tuần", to: "/promotions" },
  { icon: <Zap size={22} />, label: "Đặt vé siêu nhanh", sub: "Chỉ 3 bước đơn giản", to: "/movies" },
];

const FeaturesStrip = () => {
  const [ref, visible] = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`bg-gray-950 border-b border-white/5 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
          {FEATURES.map((f, i) => (
            <Link
              key={i}
              to={f.to}
              className="flex items-center gap-3 px-4 sm:px-6 py-4 sm:py-5 group hover:bg-white/5 transition-colors duration-200"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="text-red-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                {f.icon}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs sm:text-sm font-bold leading-tight truncate">{f.label}</p>
                <p className="text-gray-500 text-[10px] sm:text-xs truncate mt-0.5">{f.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesStrip;
