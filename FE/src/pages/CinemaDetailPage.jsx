import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import axiosInstance from "../api/axiosConfig";
import {
  MapPin, Phone, ChevronLeft, Film, Clock, Ticket, Star,
  Info, Calendar, Car, Coffee, Wifi, Accessibility, Monitor, Music, Navigation
} from "lucide-react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80";

const toVNDateStr = (d = new Date()) => {
  const vn = new Date(+d + 7 * 60 * 60 * 1000);
  return vn.toISOString().split("T")[0];
};
const vnDay = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDay();
const vnDate = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDate();
const vnMonth = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCMonth();

const CinemaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cinema, setCinema] = useState(null);
  const [movieGroups, setMovieGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => toVNDateStr());
  const [activeTab, setActiveTab] = useState("showtimes");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cinemasRes, showtimesRes] = await Promise.all([
          axiosInstance.get("/admin/cinemas"),
          axiosInstance.get(`/showtimes?cinemaId=${id}`),
          new Promise((r) => setTimeout(r, 800)),
        ]);

        const found = cinemasRes.data.find((c) => c._id === id);
        setCinema(found || null);

        const grouped = {};
        showtimesRes.data.forEach((st) => {
          if (!st.movie) return;
          const mid = st.movie._id;
          if (!grouped[mid]) {
            grouped[mid] = { movie: st.movie, showtimes: [] };
          }
          grouped[mid].showtimes.push(st);
        });
        setMovieGroups(Object.values(grouped));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBooking = (showtime, movie) => {
    navigate(`/booking/${movie._id}`, {
      state: {
        selectedShowtime: {
          showtimeId: showtime._id,
          time: showtime.startTime,
          date: showtime.date,
          cinemaId: id,
          cinemaName: cinema?.name || "",
          address: cinema?.address || "",
          price: showtime.price,
          roomName: showtime.room?.name || "",
          duration: movie.duration || 0,
        },
        selectedDate,
        movieTitle: movie.title,
        poster: movie.poster,
      },
    });
  };

  const handleOpenMap = () => {
    if (!cinema?.address) return;
    const q = encodeURIComponent(cinema.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  const filteredGroups = movieGroups.map((g) => ({
    ...g,
    showtimes: g.showtimes.filter((st) => {
      if (!selectedDate) return true;
      return toVNDateStr(new Date(st.date)) === selectedDate;
    }),
  })).filter((g) => g.showtimes.length > 0);

  const dateOptions = [];
  const WEEKDAY = ["CN","Hai","Ba","Tư","Năm","Sáu","Bảy"];
  for (let i = 0; i < 8; i++) {
    const d = new Date(+new Date() + i * 24 * 60 * 60 * 1000);
    const val = toVNDateStr(d);
    const day = vnDay(d);
    dateOptions.push({
      value: val,
      label: (() => {
        if (i === 0) return "Hôm nay";
        if (i === 1) return "Ngày mai";
        return `${WEEKDAY[day]}`;
      })(),
      fullDate: `${vnDate(d)}/${vnMonth(d)+1}`
    });
  }

  const amenities = [
    { icon: <Car size={20} />, label: "Bãi đỗ xe", desc: "Rộng rãi, an toàn" },
    { icon: <Coffee size={20} />, label: "Popcorn bar", desc: "Đa dạng hương vị" },
    { icon: <Wifi size={20} />, label: "Wi-Fi free", desc: "Tốc độ cao" },
    { icon: <Accessibility size={20} />, label: "Lối đi riêng", desc: "Dành cho NKT" },
    { icon: <Monitor size={20} />, label: "Màn hình 4K", desc: "Sắc nét vượt trội" },
    { icon: <Music size={20} />, label: "Dolby Atmos", desc: "Âm thanh sống động" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-16 max-w-6xl">
        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-200 rounded-3xl"></div>
            <div className="h-12 bg-gray-200 rounded-xl w-1/2 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>)}
            </div>
          </div>
        ) : !cinema ? (
          <div className="text-center py-24">
            <p className="text-gray-400 font-bold text-lg">Không tìm thấy rạp chiếu này.</p>
            <Link to="/cinemas" className="mt-4 inline-block text-red-600 font-bold hover:underline">Xem tất cả rạp</Link>
          </div>
        ) : (
          <>
            {/* ── HERO BANNER ── */}
            <div className="relative rounded-[2.5rem] overflow-hidden mb-12 h-[320px] md:h-[440px] shadow-2xl group/banner">
              <img
                src={cinema.image || FALLBACK_IMAGE}
                alt={cinema.name}
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                className="w-full h-full object-cover"
              />
              {/* Cinematic gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
              {/* Subtle vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

              {/* Back button */}
              <Link
                to="/cinemas"
                className="absolute top-6 left-6 inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-xl text-white rounded-full text-sm font-bold hover:bg-white hover:text-black transition-all z-10 border border-white/20"
              >
                <ChevronLeft size={18} /> Quay lại
              </Link>

              {/* Hero content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-600 text-[10px] uppercase font-black px-3 py-1.5 rounded-full tracking-widest shadow-lg shadow-red-900/50">
                    Cinema
                  </span>
                  <div className="flex text-yellow-400 gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                </div>
                <h1 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-white drop-shadow-lg">
                  {cinema.name}
                </h1>
                <div className="flex flex-col sm:flex-row gap-4 text-white/80">
                  <div className="flex items-start gap-2 max-w-xl">
                    <MapPin size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="font-medium text-sm md:text-base leading-snug">{cinema.address}</span>
                  </div>
                  {cinema.phone && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Phone size={18} className="text-red-400 shrink-0" />
                      <span className="font-bold text-white">{cinema.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex justify-center mb-10">
              <div className="relative flex bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
                <div
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gray-900 rounded-xl shadow-lg shadow-gray-300 transition-transform duration-300 ease-in-out ${activeTab === "info" ? "translate-x-full" : "translate-x-0"}`}
                />
                {[
                  { key: "showtimes", icon: <Calendar size={16} />, label: "Lịch Chiếu" },
                  { key: "info", icon: <Info size={16} />, label: "Thông Tin Rạp" },
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`relative z-10 flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-colors duration-200 ${activeTab === key ? "text-white" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "showtimes" ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Date picker */}
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  {dateOptions.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`flex-shrink-0 min-w-[100px] p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-1 ${
                        selectedDate === d.value
                          ? "bg-red-600 border-red-600 text-white shadow-xl shadow-red-100 scale-105"
                          : "bg-white border-gray-100 text-gray-500 hover:border-red-600 hover:text-red-600"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-black tracking-widest">{d.label}</span>
                      <span className="text-xl font-black">{d.fullDate.split('/')[0]}</span>
                      <span className="text-[10px] font-bold">Tháng {d.fullDate.split('/')[1]}</span>
                    </button>
                  ))}
                </div>

                {/* Movie list */}
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 shadow-sm">
                    <Film size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold text-lg italic">Hiện không có suất chiếu nào cho ngày này.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    {filteredGroups.map(({ movie, showtimes }) => (
                      <div key={movie._id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 group">
                        <div className="flex flex-col md:flex-row">
                          {/* Poster — fixed aspect on mobile, full height on desktop */}
                          <div className="md:w-56 shrink-0 bg-gray-900 flex items-center justify-center overflow-hidden">
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-64 md:h-full object-cover md:object-cover transition-transform duration-700 group-hover:scale-105"
                              onError={(e) => { e.target.src = "https://via.placeholder.com/300x450?text=No+Image"; }}
                            />
                          </div>

                          <div className="flex-1 p-6 md:p-8">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              {movie.ageRestriction && (
                                <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded font-black">{movie.ageRestriction}</span>
                              )}
                              <span className="flex items-center gap-1 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                <Clock size={14} /> {movie.duration} phút
                              </span>
                              <span className="flex items-center gap-1 text-yellow-500 text-sm font-black">
                                <Star size={14} fill="currentColor" /> {movie.rating || "8.5"}
                              </span>
                            </div>

                            <Link to={`/movie/${movie._id}`}>
                              <h3 className="text-2xl font-black text-gray-900 mb-6 group-hover:text-red-600 transition-colors uppercase leading-tight">{movie.title}</h3>
                            </Link>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                              {showtimes.map((st) => (
                                <button
                                  key={st._id}
                                  onClick={() => handleBooking(st, movie)}
                                  className="group/time flex flex-col items-center px-3 py-3 rounded-2xl border-2 border-gray-100 hover:border-red-600 hover:bg-red-50 transition-all active:scale-95"
                                >
                                  <span className="font-black text-base text-gray-800 group-hover/time:text-red-600">{st.startTime}</span>
                                  <span className="text-[10px] text-gray-400 font-bold mt-1 group-hover/time:text-red-400">{st.price?.toLocaleString()}đ</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Giới thiệu */}
                    <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="text-2xl font-black mb-6 uppercase tracking-tight flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-red-600 rounded-full"></span>
                        Giới Thiệu
                      </h3>
                      <p className="text-gray-600 leading-loose font-medium">
                        Chào mừng bạn đến với {cinema.name}. Đây là một trong những rạp chiếu phim hiện đại nhất trong hệ thống,
                        được đầu tư kỹ lưỡng về trang thiết bị và không gian kiến trúc. Chúng tôi tự hào mang đến trải nghiệm
                        điện ảnh chuẩn quốc tế với các phòng chiếu hiện đại, âm thanh vòm sống động và đội ngũ nhân viên phục vụ tận tâm.
                      </p>
                    </section>

                    {/* Tiện ích */}
                    <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="text-2xl font-black mb-8 uppercase tracking-tight flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-red-600 rounded-full"></span>
                        Tiện Ích Tại Rạp
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {amenities.map((item, idx) => (
                          <div key={idx} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-3xl hover:bg-red-50 transition-colors group">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 text-gray-400 group-hover:text-red-600 shadow-sm transition-colors">
                              {item.icon}
                            </div>
                            <h4 className="font-black text-gray-800 text-sm mb-1">{item.label}</h4>
                            <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-8">
                    {/* Vị trí + Bản đồ */}
                    <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Vị Trí</h3>

                      {/* Map visual */}
                      <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-5 relative group cursor-pointer" onClick={handleOpenMap}>
                        <img
                          src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-l+dc2626(${encodeURIComponent(cinema.address)})/auto/600x450?access_token=pk.eyJ1IjoiaG9hbmtoIiwiYSI6ImNscW5hN25qYjA1bmYya29qem9qem9qZW0ifQ.placeholder`}
                          alt="Bản đồ"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                          <div className="bg-red-600 p-3 rounded-full text-white shadow-xl group-hover:scale-110 transition-transform">
                            <MapPin size={24} />
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="flex items-start gap-3 mb-5 p-4 bg-gray-50 rounded-2xl">
                        <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">{cinema.address}</p>
                      </div>

                      <button
                        onClick={handleOpenMap}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-gray-200 hover:shadow-red-200 flex items-center justify-center gap-2"
                      >
                        <Navigation size={18} /> Chỉ Đường Trên Google Maps
                      </button>
                    </section>

                    {/* Liên hệ */}
                    <section className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-[2rem] text-white shadow-xl shadow-red-100">
                      <h3 className="text-xl font-black mb-4 uppercase">Liên Hệ Đặt Vé</h3>
                      <p className="text-white/80 text-sm mb-6 font-medium">Liên hệ hotline để được hỗ trợ đặt vé đoàn hoặc tổ chức sự kiện.</p>
                      <div className="flex items-center gap-4 text-2xl font-black tracking-tighter">
                        <Phone size={24} />
                        {cinema.phone || "1900 6606"}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CinemaDetailPage;
