import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/shared/components/common/Navbar";
import Footer from "@/shared/components/common/Footer";
import ReviewSection from "@/features/movies/components/ReviewSection";
import MovieHero from "@/features/movies/components/MovieHero";
import ShowtimeSelector from "@/features/movies/components/ShowtimeSelector";
import { getMovie } from "@/api/services/movie-service";
import { getMovieShowtimes } from "@/api/services/showtime-service";
import { Ticket, X } from "lucide-react";
import { useWishlist } from "@/shared/contexts/wishlist-context";

const toVNDateStr = (d = new Date()) =>
  new Date(+d + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const isLoggedIn = !!localStorage.getItem("token");

  const [movie, setMovie] = useState(null);
  const [cinemaList, setCinemaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => toVNDateStr());
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [showtimeVisible, setShowtimeVisible] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const showtimeSectionRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  const fetchShowtimes = useCallback(async () => {
    try {
      const data = await getMovieShowtimes(id);
      setCinemaList((prev) => {
        const openIds = new Set(prev.filter((c) => c.isOpen).map((c) => c.id));
        const grouped = {};
        data.forEach((st) => {
          if (!st.cinema) return;
          const cid = st.cinema._id;
          if (!grouped[cid])
            grouped[cid] = { id: cid, name: st.cinema.name, address: st.cinema.address, showtimes: [], isOpen: openIds.has(cid) };
          grouped[cid].showtimes.push(st);
        });
        return Object.values(grouped);
      });
    } catch { /* silent poll failure */ }
  }, [id]);

  // Initial load: movie + showtimes in parallel
  useEffect(() => {
    (async () => {
      try {
        const [movieData, showtimeData] = await Promise.all([
          getMovie(id),
          getMovieShowtimes(id),
        ]);
        setMovie(movieData);
        const grouped = {};
        showtimeData.forEach((st) => {
          if (!st.cinema) return;
          const cid = st.cinema._id;
          if (!grouped[cid])
            grouped[cid] = { id: cid, name: st.cinema.name, address: st.cinema.address, showtimes: [], isOpen: false };
          grouped[cid].showtimes.push(st);
        });
        setCinemaList(Object.values(grouped));
      } catch (err) {
        console.error("Error fetching movie detail:", err);
      } finally {
        setLoading(false);
        setTimeout(() => setShowtimeVisible(true), 80);
      }
    })();
  }, [id]);

  // Poll showtimes every 5s (catches admin cancellations) + tick every 1s (lock state)
  useEffect(() => {
    const pollId = setInterval(fetchShowtimes, 5_000);
    const tickId = setInterval(() => setNowTick(Date.now()), 1_000);
    return () => { clearInterval(pollId); clearInterval(tickId); };
  }, [fetchShowtimes]);

  const toggleCinema = (cinemaId) =>
    setCinemaList(cinemaList.map((c) => ({ ...c, isOpen: c.id === cinemaId ? !c.isOpen : false })));

  const handleSelectTime = (showtime, cinema) =>
    setSelectedShowtime({
      showtimeId: showtime._id,
      time: showtime.startTime,
      date: showtime.date,
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      address: cinema.address,
      price: showtime.price,
      roomName: showtime.room?.name || "",
      duration: movie?.duration || 0,
    });

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: movie?.title, text: `Xem phim ${movie?.title} tại 5Cine`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Đã sao chép link!", { duration: 1500 });
      });
    }
  };

  const handleWishlistToggle = () => {
    toggleWishlist(movie._id);
    const isSaved = wishlistIds.has(movie._id);
    toast(isSaved ? "Đã bỏ khỏi yêu thích" : "Đã thêm vào yêu thích ❤️", { duration: 1500 });
  };

  const handleBookNow = () => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    showtimeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast("Chọn suất chiếu bên dưới 👇", { icon: "🎬" });
  };

  // Detect YouTube trailer id
  const youtubeId = (() => {
    if (!movie?.trailer) return null;
    const m = movie.trailer.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    return m ? m[1] : null;
  })();

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <div className="relative pt-20 pb-10 bg-gradient-to-b from-black to-[#0a0a0f] overflow-hidden">
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
          <div className="relative max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-8 items-end pt-16">
            <div className="w-[160px] md:w-[200px] h-[240px] md:h-[300px] bg-white/10 rounded-2xl animate-pulse shrink-0" />
            <div className="flex-1 space-y-4 pb-4">
              <div className="h-4 bg-white/10 rounded w-24 animate-pulse" />
              <div className="h-10 bg-white/10 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-40 animate-pulse" />
              <div className="h-16 bg-white/10 rounded animate-pulse" />
              <div className="flex gap-3 pt-2">
                <div className="h-12 w-36 bg-white/10 rounded-xl animate-pulse" />
                <div className="h-12 w-28 bg-white/10 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6 bg-[#f8f8f8] dark:bg-gray-950">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <p className="text-slate-400 dark:text-gray-500 text-lg font-medium">Không tìm thấy phim.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-gray-950 font-sans text-gray-900 dark:text-white">
      <Helmet>
        <title>{`${movie.title} — 5Cine`}</title>
        <meta name="description" content={movie.description?.slice(0, 160) || "Xem thông tin phim và đặt vé tại 5Cine"} />
        <meta property="og:title" content={`${movie.title} — 5Cine`} />
        <meta property="og:image" content={movie.poster || ""} />
        <meta property="og:type" content="video.movie" />
      </Helmet>
      <Navbar />

      {/* Hero section */}
      <MovieHero
        movie={movie}
        movieId={id}
        selectedShowtime={selectedShowtime}
        selectedDate={selectedDate}
        wishlistIds={wishlistIds}
        isLoggedIn={isLoggedIn}
        copied={copied}
        onTrailerOpen={() => setIsTrailerOpen(true)}
        onWishlistToggle={handleWishlistToggle}
        onShare={handleShare}
        onBookNow={handleBookNow}
      />

      {/* Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {/* Showtime selector */}
        <div ref={showtimeSectionRef}>
          <ShowtimeSelector
            cinemaList={cinemaList}
            selectedDate={selectedDate}
            selectedShowtime={selectedShowtime}
            nowTick={nowTick}
            visible={showtimeVisible}
            onDateChange={setSelectedDate}
            onToggleCinema={toggleCinema}
            onSelectTime={handleSelectTime}
          />
        </div>

        {/* Reviews */}
        <ReviewSection movieId={id} />
      </main>

      {/* Trailer modal */}
      {isTrailerOpen && youtubeId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-12">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-[fadeIn_0.2s_ease_forwards]"
            onClick={() => setIsTrailerOpen(false)}
          />
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black animate-[scaleIn_0.25s_ease_forwards]">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={`Trailer - ${movie.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Sticky mobile booking bar */}
      {selectedShowtime && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden animate-[slideUp_0.3s_ease_forwards]">
          <Link to={`/booking/${id}`} state={{ selectedShowtime, selectedDate, movieTitle: movie.title, poster: movie.poster }}>
            <div className="bg-[#dc2626] px-5 py-4 flex items-center justify-between shadow-[0_-4px_30px_rgba(220,38,38,0.3)]">
              <div>
                <p className="text-red-200 text-[9px] uppercase tracking-widest font-bold">Suất đã chọn</p>
                <p className="text-white font-black text-sm">{selectedShowtime.time} · {selectedShowtime.cinemaName}</p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl transition-colors">
                <Ticket size={16} className="text-white" />
                <span className="text-white font-black text-sm">Đặt ngay</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MovieDetailPage;
