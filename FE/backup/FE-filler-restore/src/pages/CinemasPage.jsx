import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import axiosInstance from "../api/axiosConfig";

const FALLBACK_IMAGE = "https://picsum.photos/seed/cinema/800/400";

const CinemasPage = () => {
  const navigate = useNavigate();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/admin/cinemas")
      .then((res) => setCinemas(res.data))
      .catch(() => setCinemas([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      <main className="container mx-auto px-6 pt-24 md:pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-[#dc2626] mb-4 uppercase tracking-tight">
            Hệ Thống Rạp
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto">
            Trải nghiệm không gian điện ảnh đẳng cấp quốc tế với hệ thống âm thanh vòm và màn hình sắc nét.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {cinemas.map((cinema) => (
              <div
                key={cinema._id}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={cinema.image || FALLBACK_IMAGE}
                    alt={cinema.name}
                    onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{cinema.name}</h3>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4 text-gray-600">
                    <MapPin size={20} className="text-[#dc2626] flex-shrink-0 mt-1" />
                    <p className="text-sm font-medium leading-relaxed">{cinema.address}</p>
                  </div>
                  {cinema.phone && (
                    <div className="flex items-center gap-3 mb-6 text-gray-600">
                      <Phone size={20} className="text-[#dc2626]" />
                      <p className="text-sm font-bold">{cinema.phone}</p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate(`/cinemas/${cinema._id}`)}
                    className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-bold group-hover:bg-[#dc2626] group-hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    Xem Chi Tiết <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CinemasPage;
