import React from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { MapPin, Phone, ArrowRight } from "lucide-react";

// Mock data riêng cho trang rạp
const cinemas = [
  {
    id: 1,
    name: "5Cine Royal City",
    address: "B2-R3, TTTM Royal City, 72A Nguyễn Trãi, Thanh Xuân, Hà Nội",
    phone: "1900 1234",
    image:
      "https://images.unsplash.com/photo-1517604931442-710c8ef5ad25?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "5Cine Times City",
    address:
      "B1, TTTM Vincom Mega Mall Times City, 458 Minh Khai, Hai Bà Trưng, Hà Nội",
    phone: "1900 5678",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "5Cine Cầu Giấy",
    address: "Tầng 4, TTTM Discovery Complex, 302 Cầu Giấy, Hà Nội",
    phone: "1900 9999",
    image:
      "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=800&auto=format&fit=crop",
  },
];

const CinemasPage = () => {
  return (
    <div className="min-h-screen bg-white font-bromega text-gray-900">
      <Navbar />

      <main className="container mx-auto px-6 pt-24 md:pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-[#dc2626] mb-4 uppercase tracking-tight">
            Hệ Thống Rạp
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto">
            Trải nghiệm không gian điện ảnh đẳng cấp quốc tế với hệ thống âm
            thanh vòm và màn hình IMAX sắc nét.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cinemas.map((cinema) => (
            <div
              key={cinema.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={cinema.image}
                  alt={cinema.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{cinema.name}</h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4 text-gray-600">
                  <MapPin
                    size={20}
                    className="text-[#dc2626] flex-shrink-0 mt-1"
                  />
                  <p className="text-sm font-medium leading-relaxed">
                    {cinema.address}
                  </p>
                </div>
                <div className="flex items-center gap-3 mb-6 text-gray-600">
                  <Phone size={20} className="text-[#dc2626]" />
                  <p className="text-sm font-bold">{cinema.phone}</p>
                </div>

                <button className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-bold group-hover:bg-[#dc2626] group-hover:text-white transition-all flex items-center justify-center gap-2">
                  Xem Bản Đồ <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CinemasPage;
