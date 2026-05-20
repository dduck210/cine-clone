import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/admin/Sidebar";
import axiosInstance from "../../api/axiosConfig";
import {
  Bell, DollarSign, Ticket, Clock, AlertTriangle, Menu, ExternalLink,
  Popcorn, RefreshCw, TrendingUp, Trophy,
} from "lucide-react";
import { OrdersManager, OrderDetailModal } from "../../components/admin/OrdersTab";
import { MoviesManager, MovieModal } from "../../components/admin/MoviesTab";
import { ShowtimesManager, ShowtimeModal } from "../../components/admin/ShowtimesTab";
import { UsersManager } from "../../components/admin/UsersTab";
import { RoomsManager } from "../../components/admin/RoomsTab";
import { ReviewsManager } from "../../components/admin/ReviewsTab";

const toastConfig = {
  position: "top-right",
  toastOptions: {
    duration: 4000,
    className: "!bg-white !text-slate-800 !shadow-2xl !rounded-xl !border !border-slate-100 !font-medium",
  },
};

const StatCard = ({ icon, label, value, sub, color }) => {
  const Icon = icon;
  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(220,38,38,0.1)] border border-slate-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-extrabold text-slate-800 mt-1 group-hover:text-[#dc2626] transition-colors">{value}</h3>
      <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>
    </div>
  );
};

const DashboardView = ({ stats, extStats, loading }) => (
  <div className="space-y-6">
    {/* Main stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {loading ? (
        [1, 2, 3, 4].map((i) => <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-slate-100" />)
      ) : (
        <>
          <StatCard icon={DollarSign} label="Doanh thu vé" value={stats.totalRevenue.toLocaleString("vi-VN") + " đ"} sub="Vé đã thanh toán" color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Popcorn} label="Doanh thu F&B" value={extStats.comboRevenue.toLocaleString("vi-VN") + " đ"} sub="Bắp rang, nước, combo" color="bg-orange-50 text-orange-500" />
          <StatCard icon={Ticket} label="Vé đã bán" value={stats.totalBookings} sub="Đơn đã hoàn tất" color="bg-red-50 text-[#dc2626]" />
          <StatCard icon={RefreshCw} label="Vé hoàn" value={extStats.refunds.totalRefunds} sub={extStats.refunds.totalRefundAmount.toLocaleString("vi-VN") + " đ đã hoàn"} color="bg-blue-50 text-blue-500" />
        </>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Khung giờ hot */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-[#dc2626]" /> Khung giờ bán chạy
        </h3>
        {loading || !extStats.timeslots.length ? (
          <p className="text-slate-400 text-sm italic">Chưa có dữ liệu</p>
        ) : (() => {
          const max = extStats.timeslots[0]?.bookings || 1;
          const BAR_MAX_PX = 110;
          const SHORT = { morning: "Sáng", evening: "Chiều", night: "Tối" };
          const SUB = { morning: "trước 12h", evening: "12–18h", night: "sau 18h" };
          const COLORS = { morning: "#f97316", evening: "#dc2626", night: "#991b1b" };
          return (
            <div>
              {/* Chart */}
              <div className="flex items-end justify-around gap-3 px-2 border-b border-slate-100" style={{ height: `${BAR_MAX_PX + 32}px` }}>
                {extStats.timeslots.map((ts) => {
                  const barH = Math.max(10, Math.round((ts.bookings / max) * BAR_MAX_PX));
                  return (
                    <div key={ts._id} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs font-bold text-slate-600 mb-1">{ts.bookings} vé</span>
                      <div
                        className="w-full max-w-[52px] rounded-t-lg transition-all duration-700"
                        style={{ height: `${barH}px`, backgroundColor: COLORS[ts._id] || "#dc2626" }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-around gap-3 px-2 pt-3">
                {extStats.timeslots.map((ts) => (
                  <div key={ts._id} className="flex-1 text-center">
                    <p className="text-xs font-bold text-slate-600">{SHORT[ts._id] || ts._id}</p>
                    <p className="text-[10px] text-slate-400">{SUB[ts._id] || ""}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Doanh thu F&B chi tiết */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Popcorn size={18} className="text-orange-500" /> Chi tiết doanh thu F&B
        </h3>
        {loading || !extStats.comboItems.length ? (
          <p className="text-slate-400 text-sm italic">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-2">
            {extStats.comboItems.map((item) => (
              <div key={item._id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{item._id}</p>
                  <p className="text-xs text-slate-400">×{item.totalQuantity} phần</p>
                </div>
                <span className="font-bold text-orange-500">{item.totalRevenue.toLocaleString()}đ</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Top phim doanh thu */}
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
        <Trophy size={18} className="text-yellow-500" /> Top phim doanh thu cao nhất
      </h3>
      {loading || !extStats.topMovies.length ? (
        loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <p className="text-slate-400 text-sm italic">Chưa có dữ liệu</p>
        )
      ) : (() => {
        const maxRevenue = extStats.topMovies[0]?.revenue || 1;
        const MEDAL = ["🥇", "🥈", "🥉"];
        return (
          <div className="space-y-3">
            {extStats.topMovies.map((movie, idx) => (
              <div key={movie._id} className="flex items-center gap-3 group">
                <span className="w-6 text-center text-base flex-shrink-0">
                  {MEDAL[idx] || <span className="text-xs font-bold text-slate-400">{idx + 1}</span>}
                </span>
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0 shadow-sm" />
                ) : (
                  <div className="w-10 h-14 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <Ticket size={16} className="text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm truncate group-hover:text-[#dc2626] transition-colors">{movie.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-700"
                        style={{ width: `${Math.round((movie.revenue / maxRevenue) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{movie.bookings} vé</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#dc2626] flex-shrink-0 whitespace-nowrap">
                  {movie.revenue.toLocaleString("vi-VN")}đ
                </span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>

    {/* Pending/expired summary */}
    {!loading && (stats.pendingBookings > 0 || stats.expiredBookings > 0) && (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-amber-700 font-bold text-lg">{stats.pendingBookings}</p>
            <p className="text-amber-600 text-xs font-medium">Đơn đang chờ thanh toán</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-slate-400 shrink-0" />
          <div>
            <p className="text-slate-600 font-bold text-lg">{stats.expiredBookings || 0}</p>
            <p className="text-slate-500 text-xs font-medium">Đơn hết hạn (không thanh toán)</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const bookingParam = searchParams.get("booking");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const adminUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const notificationsRef = useRef(null);
  const notificationsOpenRef = useRef(false);

  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [genreOptions, setGenreOptions] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0, pendingBookings: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [extStats, setExtStats] = useState({ comboRevenue: 0, comboItems: [], timeslots: [], refunds: { totalRefunds: 0, totalRefundAmount: 0 }, topMovies: [] });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimesLoading, setShowtimesLoading] = useState(false);
  const [cinemas, setCinemas] = useState([]);
  const [isShowtimeModalOpen, setIsShowtimeModalOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovie, setCurrentMovie] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/admin/notifications");
      setNotifications(res.data.items || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // Keep the dashboard usable even if notification history fails to load.
    }
  }, []);

  const buildNotificationStreamUrl = () => {
    if (!localStorage.getItem("token")) return null;

    const baseURL = axiosInstance.defaults.baseURL || "/api";
    const normalizedBase = baseURL.replace(/\/$/, "");
    const streamPath = `${normalizedBase}/admin/notifications/stream`;

    if (/^https?:\/\//i.test(normalizedBase)) return streamPath;
    const relativeBase = normalizedBase.startsWith("/") ? normalizedBase : `/${normalizedBase}`;
    return `${window.location.origin}${relativeBase}/admin/notifications/stream`;
  };

  const markNotificationsRead = useCallback(async (ids = []) => {
    if (ids.length === 0 && unreadCount === 0) return;

    setNotifications((prev) => prev.map((item) => (
      ids.length === 0 || ids.includes(item.id)
        ? { ...item, read: true }
        : item
    )));
    setUnreadCount((prev) => (ids.length === 0 ? 0 : Math.max(0, prev - ids.length)));

    try {
      const res = await axiosInstance.post("/admin/notifications/read", { ids });
      setNotifications(res.data.items || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      loadNotifications();
    }
  }, [unreadCount, loadNotifications]);

  const handleToggleNotifications = async () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);

    if (nextOpen) {
      const unreadIds = notifications.filter((item) => !item.read).map((item) => item.id);
      if (unreadIds.length > 0) {
        await markNotificationsRead(unreadIds);
      }
    }
  };

  useEffect(() => {
    notificationsOpenRef.current = showNotifications;
  }, [showNotifications]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const streamUrl = buildNotificationStreamUrl();
    if (!streamUrl) return undefined;

    let aborted = false;
    const controller = new AbortController();

    const connectSSE = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(streamUrl, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
            Accept: "text/event-stream",
          },
        });

        if (!response.ok || !response.body) {
          void loadNotifications();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const incoming = JSON.parse(line.slice(5).trim());
              const shouldMarkRead = notificationsOpenRef.current;
              const nextItem = shouldMarkRead ? { ...incoming, read: true } : incoming;

              setNotifications((prev) => [
                nextItem,
                ...prev.filter((item) => item.id !== incoming.id),
              ].slice(0, 20));

              if (shouldMarkRead) {
                markNotificationsRead([incoming.id]);
              } else {
                setUnreadCount((prev) => prev + 1);
                toast.success(incoming.title || "Có thông báo mới", { id: incoming.id });
                if (incoming.type === "showtime_expired" && activeTab === "showtimes") {
                  axiosInstance.get("/admin/showtimes")
                    .then((r) => setShowtimes(r.data))
                    .catch(() => {});
                }
              }
            } catch {
              // Ignore malformed SSE payloads.
            }
          }
        }
      } catch {
        if (!aborted) void loadNotifications();
      }
    };

    void connectSSE();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [loadNotifications, markNotificationsRead]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch stats
  useEffect(() => {
    if (activeTab !== "dashboard") return;
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setStatsLoading(true);
      try {
        const [revenueRes, bookingsRes, comboRes, timeslotsRes, refundsRes, topMoviesRes] = await Promise.all([
          axiosInstance.get("/admin/reports/revenue"),
          axiosInstance.get("/admin/reports/bookings"),
          axiosInstance.get("/admin/reports/combo-revenue"),
          axiosInstance.get("/admin/reports/timeslots"),
          axiosInstance.get("/admin/reports/refunds"),
          axiosInstance.get("/admin/reports/top-movies"),
        ]);
        if (cancelled) return;

        const byStatus = bookingsRes.data.reduce((acc, item) => {
          acc[item._id] = item;
          return acc;
        }, {});

        setStats({
          totalRevenue: revenueRes.data.summary?.totalRevenue || 0,
          totalBookings: revenueRes.data.summary?.totalBookings || 0,
          pendingBookings: byStatus.pending?.count || 0,
          expiredBookings: byStatus.expired?.count || 0,
        });
        setExtStats({
          comboRevenue: comboRes.data.totalComboRevenue || 0,
          comboItems: comboRes.data.items || [],
          timeslots: timeslotsRes.data || [],
          refunds: refundsRes.data || { totalRefunds: 0, totalRefundAmount: 0 },
          topMovies: topMoviesRes.data || [],
        });
      } catch {
        // Keep the last dashboard snapshot if the refresh fails.
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeTab]);

  // Fetch movies
  useEffect(() => {
    if (activeTab !== "movies") return;
    const timeoutId = window.setTimeout(() => {
      setMoviesLoading(true);
      Promise.all([
        axiosInstance.get("/movies"),
        axiosInstance.get("/movies/genres"),
      ])
        .then(([moviesRes, genresRes]) => {
          setMovies(moviesRes.data);
          setGenreOptions(genresRes.data);
        })
        .catch(() => toast.error("Không tải được danh sách phim"))
        .finally(() => setMoviesLoading(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  // Fetch orders
  useEffect(() => {
    if (activeTab !== "orders") return;
    const timeoutId = window.setTimeout(() => {
      setOrdersLoading(true);
      axiosInstance.get("/admin/bookings")
        .then((res) => {
          const transformed = res.data.map((booking) => {
            const showtime = booking.showtime || {};
            const movie = showtime.movie || {};
            const cinema = showtime.cinema || {};
            return {
              _raw: booking,
              orderId: booking.bookingCode || booking._id,
              customerName: booking.user?.name || "Khách hàng",
              customerEmail: booking.user?.email || "",
              phone: booking.user?.phone || "",
              bookingTime: new Date(booking.createdAt).toLocaleString("vi-VN"),
              movieTitle: movie.title || "Phim",
              cinemaName: cinema.name || "5Cine",
              showDate: showtime.date ? new Date(showtime.date).toLocaleDateString("vi-VN") : "",
              showTime: showtime.startTime || "",
              selectedSeats: booking.seatNumbers || [],
              finalTotalPrice: booking.totalPrice,
              combos: booking.extraItems || [],
              status: booking.status === "paid" ? "Đã thanh toán" : booking.status === "cancelled" ? "Đã hủy" : booking.status === "expired" ? "Hết hạn" : booking.status === "refunded" ? "Đã hoàn tiền" : "Chờ thanh toán",
              ticketStatus: booking.ticketStatus || "not_printed",
              paymentMethod: booking.paymentId?.method || "",
              bookingRawId: booking._id,
            };
          });
          setOrders(transformed);
        })
        .catch(() => toast.error("Không tải được đơn hàng"))
        .finally(() => setOrdersLoading(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  // Auto-open order detail modal when ?booking=BKXXX is in URL
  useEffect(() => {
    if (!bookingParam || ordersLoading || !orders.length) return;
    const timeoutId = window.setTimeout(() => {
      const found = orders.find((o) => o.orderId === bookingParam);
      if (found) {
        setSelectedOrder(found);
        setIsOrderModalOpen(true);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [bookingParam, orders, ordersLoading]);

  // Fetch users
  useEffect(() => {
    if (activeTab !== "users") return;
    const timeoutId = window.setTimeout(() => {
      setUsersLoading(true);
      axiosInstance.get("/admin/users")
        .then((res) => setUsers(res.data))
        .catch(() => toast.error("Không tải được danh sách thành viên"))
        .finally(() => setUsersLoading(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  // Fetch cinemas when needed (showtimes or rooms tabs)
  useEffect(() => {
    if (activeTab !== "rooms" || cinemas.length > 0) return;
    axiosInstance.get("/admin/cinemas").then((res) => setCinemas(res.data)).catch(() => { });
  }, [activeTab, cinemas.length]);

  // Fetch showtimes + cinemas + movies (dùng cho filter và modal)
  useEffect(() => {
    if (activeTab !== "showtimes") return;
    const timeoutId = window.setTimeout(() => {
      setShowtimesLoading(true);
      Promise.all([
        axiosInstance.get("/admin/showtimes"),
        axiosInstance.get("/admin/cinemas"),
        axiosInstance.get("/movies"),
      ]).then(([stRes, cinemasRes, moviesRes]) => {
        setShowtimes(stRes.data);
        setCinemas(cinemasRes.data);
        setMovies(moviesRes.data);
      }).catch(() => toast.error("Không tải được danh sách suất chiếu"))
        .finally(() => setShowtimesLoading(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "showtimes") return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        const [stRes, cinemasRes, moviesRes] = await Promise.all([
          axiosInstance.get("/admin/showtimes"),
          axiosInstance.get("/admin/cinemas"),
          axiosInstance.get("/movies"),
        ]);

        setShowtimes(stRes.data);
        setCinemas(cinemasRes.data);
        setMovies(moviesRes.data);
      } catch {
        // Keep the current list visible if background refresh fails.
      }
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setIsSidebarOpen(false);
  };

  const handleDeleteClick = (movie) => {
    setMovieToDelete(movie);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!movieToDelete) return;
    try {
      await axiosInstance.delete(`/movies/${movieToDelete._id}`);
      setMovies(movies.filter((m) => m._id !== movieToDelete._id));
      toast.success("Đã xóa phim thành công!");
    } catch {
      toast.error("Xóa phim thất bại");
    }
    setIsDeleteModalOpen(false);
    setMovieToDelete(null);
  };

  const handleAddNew = () => {
    setCurrentMovie(null);
    setIsModalOpen(true);
  };

  const handleEdit = (movie) => {
    setCurrentMovie(movie);
    setIsModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      if (currentMovie) {
        const res = await axiosInstance.put(`/movies/${currentMovie._id}`, data);
        const { movie, warning, affectedShowtimes } = res.data;
        setMovies(movies.map((m) => (m._id === currentMovie._id ? movie : m)));
        if (warning && affectedShowtimes?.length > 0) {
          const msg = `${warning}. Bạn có muốn huỷ và hoàn tiền các suất chiếu bị ảnh hưởng không?`;
          if (window.confirm(msg)) {
            const ids = affectedShowtimes.filter(s => s.affectedBookings > 0).map(s => s._id);
            if (ids.length > 0) {
              await axiosInstance.post(`/movies/${currentMovie._id}/cancel-affected`, { showtimeIds: ids });
              toast.success(`Đã hoàn tiền cho các đơn bị ảnh hưởng!`);
            }
          }
          toast(`⚠️ ${warning}`, { icon: "⚠️", duration: 6000 });
        } else {
          toast.success("Đã cập nhật phim!");
        }
      } else {
        const res = await axiosInstance.post("/movies", { ...data, rating: 0 });
        setMovies([res.data, ...movies]);
        toast.success("Đã thêm phim mới!");
      }
    } catch {
      toast.error("Có lỗi xảy ra, thử lại sau");
    }
    setIsModalOpen(false);
  };

  const handleViewTicket = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleConfirmOrder = async (bookingId) => {
    try {
      await axiosInstance.put(`/admin/bookings/${bookingId}/confirm`);
      setOrders(orders.map((o) =>
        o.bookingRawId === bookingId ? { ...o, status: "Đã thanh toán" } : o
      ));
      toast.success("Đã xác nhận thanh toán!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Xác nhận thất bại");
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}`, data);
      setUsers(users.map((u) => (u._id === userId ? res.data : u)));
      toast.success("Đã cập nhật thành viên!");
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      toast.success("Đã xóa thành viên!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    }
  };

  const handlePrintTicket = async (bookingId) => {
    try {
      await axiosInstance.put(`/admin/bookings/${bookingId}/print`);
      setOrders(orders.map((o) =>
        o.bookingRawId === bookingId ? { ...o, ticketStatus: "printed" } : o
      ));
      toast.success("Đã đánh dấu vé đã in!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleCancelShowtime = async (showtime) => {
    if (!window.confirm(`Hủy suất chiếu "${showtime.movie?.title}" lúc ${showtime.startTime}?`)) return;
    try {
      await axiosInstance.put(`/showtimes/${showtime._id}/cancel`);
      setShowtimes(showtimes.map((s) => s._id === showtime._id ? { ...s, status: "cancelled" } : s));
      toast.success("Đã hủy suất chiếu!");
    } catch {
      toast.error("Hủy suất chiếu thất bại");
    }
  };

  const tabTitle = {
    dashboard: "Tổng Quan",
    movies: "Quản Lý Phim",
    showtimes: "Suất Chiếu",
    rooms: "Phòng & Ghế",
    orders: "Đơn Hàng",
    users: "Thành Viên",
    reviews: "Đánh Giá Phim",
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-[50] w-64 bg-white border-r border-slate-200 transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:block`}>
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        <header className="flex justify-between items-center px-4 md:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-white/50 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">
              {tabTitle[activeTab] || "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-[#dc2626] hover:border-red-200 transition-all"
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">Trang người dùng</span>
            </Link>
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={handleToggleNotifications}
                className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-[#dc2626] hover:shadow-md transition-all relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                  </>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Thông báo quản trị</p>
                      <p className="text-xs text-slate-400">Cập nhật theo thời gian thực</p>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => markNotificationsRead([])}
                        className="text-xs font-bold text-[#dc2626] hover:underline"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-slate-400">
                        Chưa có thông báo nào.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.data?.bookingCode) {
                              setSearchParams({ tab: "orders", booking: item.data.bookingCode });
                              setShowNotifications(false);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-b-0 transition-colors ${item.data?.bookingCode ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
                            } ${item.read ? "bg-white" : "bg-rose-50/50"}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${item.read ? "bg-slate-200" : "bg-rose-500"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800">{item.title}</p>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.message}</p>
                              <p className="text-[11px] text-slate-400 mt-2">
                                {item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#dc2626] rounded-xl text-white flex items-center justify-center font-bold shadow-lg shadow-red-200 text-sm">
                {adminUser?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <span className="hidden md:block text-sm font-bold text-slate-700">{adminUser?.name || "Admin"}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Toaster {...toastConfig} />
          <div className="pb-10">
            {activeTab === "dashboard" && <DashboardView stats={stats} extStats={extStats} loading={statsLoading} />}
            {activeTab === "movies" && (
              moviesLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" /></div>
              ) : (
                <MoviesManager movies={movies} handleAddNew={handleAddNew} handleEdit={handleEdit} handleDeleteClick={handleDeleteClick} />
              )
            )}
            {activeTab === "users" && <UsersManager users={users} loading={usersLoading} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} />}
            {activeTab === "showtimes" && (
              <ShowtimesManager
                showtimes={showtimes}
                loading={showtimesLoading}
                movies={movies.length > 0 ? movies : []}
                cinemas={cinemas}
                onAddNew={() => {
                  if (movies.length === 0) {
                    axiosInstance.get("/movies").then((r) => setMovies(r.data)).catch(() => { });
                  }
                  setIsShowtimeModalOpen(true);
                }}
                onCancel={handleCancelShowtime}
              />
            )}
            {activeTab === "rooms" && (
              <RoomsManager cinemas={cinemas.length > 0 ? cinemas : []} />
            )}
            {activeTab === "orders" && (
              <OrdersManager orders={orders} loading={ordersLoading} onViewTicket={handleViewTicket} onConfirm={handleConfirmOrder} onPrint={handlePrintTicket} />
            )}
            {activeTab === "reviews" && <ReviewsManager />}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <MovieModal currentMovie={currentMovie} setIsModalOpen={setIsModalOpen} handleSave={handleSave} genreOptions={genreOptions} />
      )}
      {isShowtimeModalOpen && (
        <ShowtimeModal
          movies={movies}
          cinemas={cinemas}
          onClose={() => setIsShowtimeModalOpen(false)}
          onSaved={() => {
            setShowtimesLoading(true);
            axiosInstance.get("/admin/showtimes")
              .then((r) => setShowtimes(r.data))
              .finally(() => setShowtimesLoading(false));
          }}
        />
      )}
      {isOrderModalOpen && (
        <OrderDetailModal order={selectedOrder} onClose={() => setIsOrderModalOpen(false)} onPrint={handlePrintTicket} />
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Xác nhận xoá phim?</h3>
            <p className="text-gray-500 text-sm mb-6 px-2">
              Bạn có chắc chắn muốn xoá phim <span className="font-bold text-gray-800">"{movieToDelete?.title}"</span>?
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                Hủy bỏ
              </button>
              <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
