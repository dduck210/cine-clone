import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import axiosInstance from "../api/axiosConfig";
import { MapPin, Phone, ChevronLeft, Film, Clock, Ticket, Star } from "lucide-react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80";

const CinemaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cinema, setCinema] = useState(null);
  const [movieGroups, setMovieGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cinemasRes, showtimesRes] = await Promise.all([
          axiosInstance.get("/admin/cinemas"),
          axiosInstance.get(`/showtimes?cinemaId=${id}`),
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
        },
        movieTitle: movie.title,
        poster: movie.poster,
      },
    });
  };

  const filteredGroups = movieGroups.map((g) => ({
    ...g,
    showtimes: g.showtimes.filter((st) => {
      if (!selectedDate) return true;
      const stDate = new Date(st.date).toISOString().split("T")[0];
      return stDate === selectedDate;
    }),
  })).filter((g) => g.showtimes.length > 0);

  const dateOptions = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dateOptions.push({
      value: d.toISOString().split("T")[0],
      label: (() => {
        if (i === 0) return "Hôm nay";
        if (i === 1) return "Ngày mai";
        const WEEKDAY = ["Chủ Nhật","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"];
        return `${WEEKDAY[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
      })(),
    });
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-16 max-w-5xl">
        {/* Nút quay lại */}
        <Link
          to="/cinemas"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors mb-8"
        >
          <ChevronLeft size={18} /> Quay lại Hệ Thống Rạp
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-48 bg-gray-200 rounded-2xl"></div>
          </div>
        ) : !cinema ? (
          <div className="text-center py-24">
            <p className="text-gray-400 font-bold text-lg">Không tìm thấy rạp chiếu này.</p>
            <Link to="/cinemas" className="mt-4 inline-block text-red-600 font-bold hover:underline">Xem tất cả rạp</Link>
          </div>
        ) : (
          <>
            {/* Header rạp */}
            <div className="relative rounded-3xl overflow-hidden mb-10 shadow-xl">
              <img src={cinema.image || FALLBACK_IMAGE} alt={cinema.name} onError={(e) => { e.target.src = FALLBACK_IMAGE; }} className="w-full h-48 md:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h1 className="text-2xl md:text-3xl font-black mb-2 uppercase tracking-tight">{cinema.name}</h1>
                <div className="flex flex-col sm:flex-row gap-3 text-sm font-medium text-white/80">
                  <span className="flex items-center gap-1.5"><MapPin size={14} /> {cinema.address}</span>
                  {cinema.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {cinema.phone}</span>}
                </div>
              </div>
            </div>

            {/* Chọn ngày */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-red-600 pl-3">Lịch Chiếu</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateOptions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDate(d.value)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                      selectedDate === d.value
                        ? "bg-[#dc2626] text-white border-[#dc2626] shadow-md shadow-red-200"
                        : "bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-600"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách phim + suất chiếu */}
            {filteredGroups.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Film size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">Không có suất chiếu nào trong ngày này.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGroups.map(({ movie, showtimes }) => (
                  <div key={movie._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-5 p-5">
                      <Link to={`/movie/${movie._id}`} className="flex-shrink-0">
                        <img
                          src={movie.poster}
                          alt={movie.title}
                          className="w-20 h-28 object-cover rounded-xl shadow-sm border border-gray-100 hover:scale-105 transition-transform"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/80x112?text=No+Image"; }}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/movie/${movie._id}`}>
                          <h3 className="font-bold text-lg text-gray-900 hover:text-red-600 transition-colors mb-1 line-clamp-1">{movie.title}</h3>
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                          {movie.ageRestriction && (
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold border border-red-200">{movie.ageRestriction}</span>
                          )}
                          {movie.duration && (
                            <span className="flex items-center gap-1 text-gray-500 font-medium"><Clock size={12} /> {movie.duration} phút</span>
                          )}
                          {movie.rating && (
                            <span className="flex items-center gap-1 text-yellow-600 font-bold"><Star size={12} fill="currentColor" /> {movie.rating}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {showtimes.map((st) => (
                            <button
                              key={st._id}
                              onClick={() => handleBooking(st, movie)}
                              className="group flex flex-col items-center px-4 py-2 rounded-xl border-2 border-gray-200 hover:border-[#dc2626] hover:bg-red-50 transition-all"
                            >
                              <span className="font-black text-gray-800 group-hover:text-[#dc2626] text-sm">{st.startTime}</span>
                              <span className="text-[10px] text-gray-400 font-medium mt-0.5">{st.price?.toLocaleString()}đ</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
