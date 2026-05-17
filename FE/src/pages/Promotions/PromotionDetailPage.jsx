import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Tag, CheckCircle } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { PROMOTIONS_LIST } from "../../data/promotionsData";

const PromotionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const promo = PROMOTIONS_LIST.find((p) => p.id === parseInt(id));
  const related = PROMOTIONS_LIST.filter((p) => p.id !== parseInt(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!promo) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-2xl font-bold text-gray-400">Không tìm thấy khuyến mãi</p>
          <Link to="/promotions" className="text-red-600 font-bold hover:underline">Về trang khuyến mãi</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />

      <main className="pt-20">
        {/* Hero */}
        <div className="w-full h-[40vh] md:h-[50vh] overflow-hidden relative">
          <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl mx-auto">
            <span className={`inline-block ${promo.color} text-white text-xs font-bold px-3 py-1 rounded-lg mb-3 uppercase tracking-wider shadow`}>
              {promo.tag}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
              {promo.title}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          {/* Back + meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={14} className="text-red-500" />
              <span className="font-semibold">{promo.date}</span>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-lg text-gray-500 italic mb-8 leading-relaxed border-l-4 border-red-600 pl-4">
            {promo.desc}
          </p>

          {/* Content */}
          <article className="space-y-4">
            {promo.content.map((block, i) => {
              if (block.type === "heading") {
                return (
                  <h2 key={i} className="text-xl md:text-2xl font-extrabold text-gray-900 mt-8 mb-2">
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "list") {
                return (
                  <ul key={i} className="space-y-2">
                    {block.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-3 text-gray-700 text-base">
                        <CheckCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              if (block.type === "note") {
                return (
                  <div key={i} className="mt-6 flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-6 py-4">
                    <Tag size={18} className="text-red-600 shrink-0" />
                    <span className="font-bold text-red-700 text-sm">{block.text}</span>
                  </div>
                );
              }
              return (
                <p key={i} className="text-gray-700 leading-relaxed text-base md:text-lg">
                  {block.text}
                </p>
              );
            })}
          </article>

          {/* CTA */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => {
                if (!localStorage.getItem("token")) {
                  navigate("/login");
                  return;
                }
                navigate("/movies");
              }}
              className="bg-[#dc2626] hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-red-200 transition-all hover:-translate-y-1"
            >
              Đặt vé ngay để áp dụng ưu đãi →
            </button>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gray-100">
              <h3 className="text-xl font-extrabold text-gray-800 mb-6 border-l-4 border-red-600 pl-4 uppercase tracking-wide">
                Ưu đãi khác
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/promotions/${item.id}`}
                    className="group block rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-36 overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className={`absolute top-3 left-3 ${item.color} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
                        {item.tag}
                      </span>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-800 text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={11} /> {item.date}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PromotionDetailPage;
