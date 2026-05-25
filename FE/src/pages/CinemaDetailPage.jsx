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
  for (let i = 0; i < 7; i++) {
    const d = new Date(+new Date() + i * 24 * 60 * 60 * 1000);
    const val = toVNDateStr(d);
    const day = vnDay(d);
    dateOptions.push({
      value: val,
      label: WEEKDAY[day],
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      {loading ? (
        <div className="pt-24 pb-16 max-w-6xl mx-auto px-4 sm:px-6 animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-2xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ) : !cinema ? (
        <div className="pt-24 text-center py-24 max-w-6xl mx-auto px-4">
          <p className="text-gray-400 font-bold text-lg">Không tìm thấy rạp chiếu này.</p>
          <Link to="/cinemas" className="mt-4 inline-block text-red-600 font-bold hover:underline">Xem tất cả rạp</Link>
        </div>
      ) : (
        <>
          {/* ── HERO: full-width, no rounded corners ── */}
          <div className="relative h-[260px] sm:h-[340px] md:h-[420px] overflow-hidden mt-16 md:mt-20">
            <img
              src={cinema.image || FALLBACK_IMAGE}
              alt={cinema.name}
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <Link
              to="/cinemas"
              className="absolute top-4 left-4 sm:left-8 flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-bold bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full transition-all hover:bg-black/50"
            >
              <ChevronLeft size={16} /> Quay lại
            </Link>

            <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-5 md:pb-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-red-600 text-[10px] uppercase font-black px-2.5 py-1 rounded tracking-widest">Cinema</span>
                  <div className="flex text-yellow-400 gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={11} fill="currentColor" />)}</div>
                </div>
                <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-2 leading-tight">{cinema.name}</h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-white/80 text-xs sm:text-sm">
                  <span className="flex items-center gap-1.5"><MapPin size={13} className="text-red-400 shrink-0" /><span className="line-clamp-1">{cinema.address}</span></span>
                  {cinema.phone && <span className="flex items-center gap-1.5"><Phone size={13} className="text-red-400 shrink-0" /><span className="font-bold text-white">{cinema.phone}</span></span>}
                </div>
              </div>
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
            {/* Underline tabs */}
            <div className="flex border-b border-gray-200 mb-5 sticky top-16 md:top-20 bg-gray-50 z-10">
              {[
                { key: "showtimes", icon: <Calendar size={15} />, label: "Lịch Chiếu" },
                { key: "info",      icon: <Info size={15} />,     label: "Thông Tin Rạp" },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 -mb-px transition-colors ${
                    activeTab === key ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>

            {activeTab === "showtimes" ? (
              <div>
                {/* Date strip */}
                <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-5">
                  {dateOptions.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSelectedDate(d.value)}
                      className={`flex-shrink-0 px-3 py-2.5 rounded-xl border font-bold text-xs transition-all flex flex-col items-center gap-0.5 min-w-[68px] ${
                        selectedDate === d.value
                          ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-100"
                          : "bg-white border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wide font-black">{d.label}</span>
                      <span className="text-lg font-black leading-none">{d.fullDate.split('/')[0]}</span>
                      <span className="text-[10px] opacity-70">Th.{d.fullDate.split('/')[1]}</span>
                    </button>
                  ))}
                </div>

                {filteredGroups.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Film size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-semibold">Không có suất chiếu nào cho ngày này.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredGroups.map(({ movie, showtimes }) => (
                      <div key={movie._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex">
                          <div className="w-[90px] sm:w-[110px] shrink-0 bg-gray-900">
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              style={{ minHeight: '130px' }}
                              onError={(e) => { e.target.src = "https://via.placeholder.com/200x300?text=No+Image"; }}
                            />
                          </div>
                          <div className="flex-1 p-4 sm:p-5">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              {movie.ageRestriction && (
                                <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-black">{movie.ageRestriction}</span>
                              )}
                              <span className="text-gray-400 text-xs flex items-center gap-1"><Clock size={11} /> {movie.duration} phút</span>
                              <span className="text-yellow-500 text-xs flex items-center gap-1 font-bold"><Star size={11} fill="currentColor" /> {movie.rating || "8.5"}</span>
                            </div>
                            <Link to={`/movie/${movie._id}`}>
                              <h3 className="font-black text-gray-900 mb-3 hover:text-red-600 transition-colors text-sm sm:text-base leading-snug">{movie.title}</h3>
                            </Link>
                            <div className="flex flex-wrap gap-2">
                              {showtimes.map((st) => (
                                <button
                                  key={st._id}
                                  onClick={() => handleBooking(st, movie)}
                                  className="flex flex-col items-center min-w-[90px] px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:scale-[1.04] active:scale-[0.97] bg-slate-50 text-slate-700 border-slate-200 hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-red-50"
                                >
                                  <span className="font-black text-base">{st.startTime}</span>
                                  <span className="text-[10px] font-medium mt-0.5 text-slate-400">{st.availableSeats ?? "—"} ghế trống</span>
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
              <div className="space-y-6">
                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { value: "6+",      label: "Phòng chiếu", icon: <Film size={18} /> },
                    { value: "1.200+",  label: "Chỗ ngồi",    icon: <Ticket size={18} /> },
                    { value: "Premium", label: "Hạng rạp",    icon: <Star size={18} /> },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center gap-1">
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mb-1">{s.icon}</div>
                      <p className="font-black text-gray-900 text-lg leading-none">{s.value}</p>
                      <p className="text-[11px] text-gray-400 font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left */}
                  <div className="md:col-span-2 space-y-5">
                    {/* About */}
                    <section className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-red-600 shadow-sm px-6 py-5">
                      <h3 className="font-black text-gray-900 mb-3">Giới Thiệu</h3>
                      <p className="text-gray-500 leading-relaxed text-sm">
                        Chào mừng bạn đến với <span className="font-bold text-gray-800">{cinema.name}</span> — một trong những rạp chiếu phim hiện đại bậc nhất trong hệ thống 5Cine. Được đầu tư kỹ lưỡng về trang thiết bị và không gian kiến trúc, chúng tôi mang đến trải nghiệm điện ảnh chuẩn quốc tế với âm thanh vòm sống động và đội ngũ nhân viên phục vụ tận tâm.
                      </p>
                    </section>

                    {/* Amenities — horizontal list */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                      <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-5 bg-red-600 rounded-full" />Tiện Ích Tại Rạp
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {amenities.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0 group-hover:bg-red-100 transition-colors">
                              {item.icon}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 text-sm leading-tight">{item.label}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  {/* Right */}
                  <div className="space-y-5">
                    {/* Map */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div
                        className="h-48 relative cursor-pointer group"
                        onClick={handleOpenMap}
                      >
                        <iframe
                          title="map"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(cinema.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                          className="w-full h-full border-0 pointer-events-none"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors flex items-end justify-center pb-3">
                          <span className="bg-white/90 text-xs font-semibold px-3 py-1.5 rounded-full text-gray-700 shadow opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                            <Navigation size={11} /> Mở Google Maps
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-600 leading-relaxed">{cinema.address}</p>
                        </div>
                        <button
                          onClick={handleOpenMap}
                          className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Navigation size={13} /> Chỉ Đường
                        </button>
                      </div>
                    </section>

                    {/* Contact + Hours */}
                    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="bg-gray-900 px-5 py-4">
                        <p className="text-gray-400 text-xs font-semibold mb-1">Hotline đặt vé</p>
                        <div className="flex items-center gap-2 text-white font-black text-xl">
                          <Phone size={18} className="text-red-400" />
                          {cinema.phone || "1900 6606"}
                        </div>
                      </div>
                      <div className="p-4 space-y-2 border-b border-gray-100">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Giờ hoạt động</p>
                        {[
                          { day: "Thứ 2 — Thứ 6", hours: "09:00 – 23:00" },
                          { day: "Thứ 7 — Chủ nhật", hours: "08:00 – 24:00" },
                        ].map((h, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">{h.day}</span>
                            <span className="font-bold text-gray-800">{h.hours}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4">
                        <button
                          onClick={() => setActiveTab("showtimes")}
                          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Ticket size={13} /> Xem Lịch Chiếu
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <Footer />
    </div>
  );
};

export default CinemaDetailPage;
