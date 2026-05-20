import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import ReviewSection from "../../components/movie/ReviewSection";
import axiosInstance from "../../api/axiosConfig";
import {
  Star,
  Clock,
  Calendar,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  Info,
  Ticket,
  Play,
} from "lucide-react";

function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
  return m ? m[1] : null;
}

// Always use Vietnam timezone (UTC+7) for date strings, regardless of system timezone
const toVNDateStr = (d = new Date()) => {
  const vn = new Date(+d + 7 * 60 * 60 * 1000);
  return vn.toISOString().split("T")[0];
};
const vnDay = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDay();
const vnDate = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDate();
const vnMonth = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCMonth();

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [cinemaList, setCinemaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => toVNDateStr());
  const showtimeSectionRef = useRef(null);
  const isMonday = vnDay() === 1;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movieRes, showtimeRes] = await Promise.all([
          axiosInstance.get(`/movies/${id}`),
          axiosInstance.get(`/showtimes?movieId=${id}`),
        ]);

        setMovie(movieRes.data);

        // Group showtimes by cinema
        const grouped = {};
        showtimeRes.data.forEach((st) => {
          if (!st.cinema) return;
          const cid = st.cinema._id;
          if (!grouped[cid]) {
            grouped[cid] = {
              id: cid,
              name: st.cinema.name,
              address: st.cinema.address,
              showtimes: [],
              isOpen: false,
            };
          }
          grouped[cid].showtimes.push(st);
        });
        setCinemaList(Object.values(grouped));
      } catch (err) {
        console.error("Error fetching movie detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleCinema = (cinemaId) => {
    setCinemaList(
      cinemaList.map((c) => ({
        ...c,
        isOpen: c.id === cinemaId ? !c.isOpen : false,
      })),
    );
  };

  const handleSelectTime = (showtime, cinema) => {
    setSelectedShowtime({
      showtimeId: showtime._id,
      time: showtime.startTime,
      date: showtime.date,
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      address: cinema.address,
      price: showtime.price,
      roomName: showtime.room?.name || "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <Navbar />
        <main className="container mx-auto px-6 pb-12 pt-24 md:pt-32 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-10 mb-16 animate-pulse">
            <div className="w-full md:w-[300px] flex-shrink-0">
              <div className="rounded-xl bg-gray-200 h-[450px]"></div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Không tìm thấy phim.</p>
      </div>
    );
  }

  const genreNames = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g))
    : movie.genre
      ? [movie.genre]
      : [];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      <main className="container mx-auto px-6 pb-12 pt-24 md:pt-32 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-10 mb-16 animate-fade-in-up">
          <div className="w-full md:w-[300px] flex-shrink-0">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 relative group">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-[450px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
              {movie.title}
            </h1>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-yellow-400">
                <Star size={20} fill="currentColor" />
                <span className="text-gray-900 font-bold ml-1 text-lg">
                  {movie.rating || "N/A"}
                </span>
              </div>
              {movie.ageRestriction && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded border border-red-200">
                  {movie.ageRestriction}
                </span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-8 text-justify">
              {movie.description || "Chưa có mô tả."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 mb-8 border-t border-b border-gray-100 py-6">
              <div className="space-y-5">
                {movie.duration && (
                  <div>
                    <span className="font-bold text-gray-900 block text-sm mb-1">
                      Thời lượng
                    </span>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Clock size={16} className="text-[#dc2626]" />{" "}
                      {movie.duration} phút
                    </div>
                  </div>
                )}
                {movie.releaseDate && (
                  <div>
                    <span className="font-bold text-gray-900 block text-sm mb-1">
                      Ngày phát hành
                    </span>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar size={16} className="text-[#dc2626]" />{" "}
                      {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                )}
                {movie.cast && (
                  <div>
                    <span className="font-bold text-gray-900 block text-sm mb-1">
                      Diễn viên
                    </span>
                    <div className="flex items-start gap-2 text-gray-600 text-sm">
                      <User
                        size={16}
                        className="text-[#dc2626] mt-0.5 flex-shrink-0"
                      />{" "}
                      {movie.cast}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {genreNames.length > 0 && (
                  <div>
                    <span className="font-bold text-gray-900 block text-sm mb-2">
                      Thể loại
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {genreNames.map((genre, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-bold border border-gray-200"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {movie.director && (
                  <div>
                    <span className="font-bold text-gray-900 block text-sm mb-1">
                      Đạo diễn
                    </span>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Info size={16} className="text-[#dc2626]" />{" "}
                      {movie.director}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isMonday && (
              <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-bold">
                🎉 Golden Monday — Giảm 20% giá vé hôm nay!
              </div>
            )}

            {selectedShowtime ? (
              <Link
                to={`/booking/${id}`}
                state={{
                  selectedShowtime,
                  selectedDate,
                  movieTitle: movie.title,
                  poster: movie.poster,
                }}
                className="w-full"
              >
                <button className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-bold py-4 rounded-lg shadow-lg shadow-red-200 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                  <Ticket size={20} /> Mua Vé Suất: {selectedShowtime.time} —{" "}
                  {selectedShowtime.cinemaName}
                </button>
              </Link>
            ) : (
              <button
                onClick={() => {
                  if (!localStorage.getItem("token")) {
                    navigate("/login");
                    return;
                  }
                  toast("Vui lòng chọn suất chiếu bên dưới", { icon: "👇" });
                }}
                className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-bold py-4 rounded-lg shadow-lg shadow-red-200 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <Ticket size={20} /> Đặt vé ngay
              </button>
            )}
          </div>
        </div>

        {getYoutubeId(movie.trailer) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 border-l-4 border-[#dc2626] pl-3 flex items-center gap-2">
              <Play size={20} className="text-[#dc2626]" /> Trailer
            </h2>
            <div className="rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(movie.trailer)}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title={`Trailer - ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        <div ref={showtimeSectionRef}>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 border-l-4 border-[#dc2626] pl-3">
            Lịch Chiếu Phim
          </h2>

          {/* Date picker */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(+new Date() + i * 24 * 60 * 60 * 1000);
              const val = toVNDateStr(d);
              const day = vnDay(d);
              const WEEKDAY = [
                "Chủ Nhật",
                "Thứ 2",
                "Thứ 3",
                "Thứ 4",
                "Thứ 5",
                "Thứ 6",
                "Thứ 7",
              ];
              const label =
                i === 0
                  ? "Hôm nay"
                  : i === 1
                    ? "Ngày mai"
                    : `${WEEKDAY[day]} ${vnDate(d)}/${vnMonth(d) + 1}`;
              return (
                <button
                  key={val}
                  onClick={() => setSelectedDate(val)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                    selectedDate === val
                      ? "bg-[#dc2626] text-white border-[#dc2626] shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-600"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {cinemaList
            .map((c) => ({
              ...c,
              showtimes: c.showtimes.filter(
                (st) => toVNDateStr(new Date(st.date)) === selectedDate,
              ),
            }))
            .filter((c) => c.showtimes.length === 0).length ===
            cinemaList.length && cinemaList.length > 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">
                Không có suất chiếu nào trong ngày này.
              </p>
            </div>
          ) : cinemaList.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-gray-400 font-bold">
                Hiện chưa có lịch chiếu cho phim này.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cinemaList
                .map((cinema) => {
                  const filtered = cinema.showtimes.filter(
                    (st) => toVNDateStr(new Date(st.date)) === selectedDate,
                  );
                  if (filtered.length === 0) return null;
                  return { ...cinema, showtimes: filtered };
                })
                .filter(Boolean)
                .map((cinema) => (
                  <div
                    key={cinema.id}
                    className={`border rounded-xl overflow-hidden transition-all bg-white ${
                      cinema.isOpen
                        ? "border-red-300 shadow-md"
                        : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`flex justify-between items-center p-5 cursor-pointer ${
                        cinema.isOpen
                          ? "bg-red-50"
                          : "bg-white hover:bg-gray-50"
                      }`}
                      onClick={() => toggleCinema(cinema.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-full ${cinema.isOpen ? "bg-red-100 text-[#dc2626]" : "bg-gray-100 text-gray-400"}`}
                        >
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h3
                            className={`font-bold text-lg ${cinema.isOpen ? "text-[#dc2626]" : "text-gray-800"}`}
                          >
                            {cinema.name}
                          </h3>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {cinema.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        {cinema.isOpen ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                    </div>

                    {cinema.isOpen && (
                      <div className="p-5 pt-0 bg-red-50/30 border-t border-red-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-4">
                          2D Phụ Đề
                        </p>
                        <div className="flex flex-wrap gap-3 animate-fade-in">
                          {cinema.showtimes.map((showtime) => {
                            const isSelected =
                              selectedShowtime?.showtimeId === showtime._id;
                            return (
                              <button
                                key={showtime._id}
                                onClick={() =>
                                  handleSelectTime(showtime, cinema)
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all border ${
                                  isSelected
                                    ? "bg-[#dc2626] text-white border-[#dc2626] shadow-lg scale-105"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-red-500 hover:text-[#dc2626] hover:shadow"
                                }`}
                              >
                                {showtime.startTime}
                                {showtime.availableSeats !== undefined && (
                                  <span className="ml-2 text-xs opacity-70">
                                    ({showtime.availableSeats} ghế)
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
        <ReviewSection movieId={id} />
      </main>
      <Footer />
    </div>
  );
};

export default MovieDetailPage;
