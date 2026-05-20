import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Tag, Clock } from "lucide-react";
import { PROMOTIONS_LIST } from "../data/promotionsData";

const PromotionsPage = () => {
  return (
    <div className="min-h-screen bg-white font-bromega text-gray-900">
      <Navbar />

      <main className="container mx-auto px-6 pt-24 md:pt-32 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-[#dc2626] font-bold text-sm mb-4 border border-red-100">
            <Tag size={16} /> Ưu đãi hot
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#dc2626] mb-4 uppercase tracking-tight">
            Tin Tức & Khuyến Mãi
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {PROMOTIONS_LIST.map((promo) => (
            <Link
              to={`/promotions/${promo.id}`}
              key={promo.id}
              className="bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 group flex flex-col"
            >
              {/* Image */}
              <div className="h-56 overflow-hidden relative">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span
                    className={`${promo.color} text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md`}
                  >
                    HOT
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-gray-800 mb-3 group-hover:text-[#dc2626] transition-colors">
                  {promo.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">
                  {promo.desc}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                    <Clock size={16} />
                    {promo.date}
                  </div>
                  <span className="text-[#dc2626] font-bold text-sm">
                    Xem chi tiết →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PromotionsPage;
