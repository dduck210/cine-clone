import React from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Tag, Clock } from "lucide-react";

// Mock data khuyến mãi
const promotions = [
  {
    id: 1,
    title: "Thứ 3 Vui Vẻ - Vé Chỉ 45K",
    desc: "Áp dụng cho tất cả các suất chiếu vào ngày thứ 3 hàng tuần. Không áp dụng ngày lễ.",
    date: "Đến 31/12/2026",
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop",
    color: "bg-orange-500",
  },
  {
    id: 2,
    title: "Combo Bắp Nước - Mua 1 Tặng 1",
    desc: "Tặng ngay 1 nước ngọt khi mua Combo Bắp Nước size L. Áp dụng thành viên U22.",
    date: "Đến 30/06/2026",
    image:
      "https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=800&auto=format&fit=crop",
    color: "bg-blue-500",
  },
  {
    id: 3,
    title: "Ưu Đãi Học Sinh Sinh Viên",
    desc: "Đồng giá 50K cho HSSV khi xuất trình thẻ. Áp dụng trước 17h từ Thứ 2 đến Thứ 6.",
    date: "Dài hạn",
    image:
      "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?q=80&w=800&auto=format&fit=crop",
    color: "bg-green-500",
  },
  {
    id: 4,
    title: "Quà Tặng Sinh Nhật Thành Viên",
    desc: "Tặng 1 vé xem phim 2D miễn phí trong tháng sinh nhật của thành viên 5Cine Stars.",
    date: "Dài hạn",
    image:
      "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?q=80&w=800&auto=format&fit=crop",
    color: "bg-purple-500",
  },
];

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
          {promotions.map((promo) => (
            <div
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
                  <button className="text-[#dc2626] font-bold text-sm hover:underline">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PromotionsPage;
