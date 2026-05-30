import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Sidebar from "@/features/admin/components/Sidebar";
import { getNotifications, markNotificationsRead as markNotificationsReadService } from "@/api/services/notification-service";
import { getUsers } from "@/api/services/user-service";
import axiosInstance from "@/api/axiosConfig"; // kept for axiosInstance.defaults.baseURL (SSE URL construction only)
import { getMovies, getMovieGenres, createMovie, updateMovie, cancelAffectedShowtimes } from "@/api/services/movie-service";
import { getCinemas } from "@/api/services/cinema-service";
import { getShowtimes, cancelShowtime, bulkCancelShowtimes } from "@/api/services/showtime-service";
import { getAdminBookings, confirmBooking, printBooking, updateUser } from "@/api/services/order-service";
import { getRevenueReport, getBookingsReport, getComboRevenueReport, getTimeslotsReport, getRefundsReport, getTopMoviesReport } from "@/api/services/report-service";
import {
  Bell, Menu, ExternalLink,
} from "lucide-react";
import DashboardStats from "@/features/admin/pages/DashboardStats";
import { OrdersManager, OrderDetailModal } from "@/features/admin/components/OrdersTab";
import { MoviesManager, MovieModal } from "@/features/admin/components/MoviesTab";
import { ShowtimesManager, ShowtimeModal } from "@/features/admin/components/ShowtimesTab";
import { UsersManager } from "@/features/admin/components/UsersTab";
import { RoomsManager } from "@/features/admin/components/RoomsTab";
import { CinemasManager } from "@/features/admin/components/CinemasTab";
import { ReviewsManager } from "@/features/admin/components/ReviewsTab";
import { VouchersManager } from "@/features/admin/components/VouchersTab";
import { AuditManager } from "@/features/admin/components/AuditTab";


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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
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
      const data = await markNotificationsReadService(ids);
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
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
                // skip toast for admin-initiated actions that already show their own toast
                const skipToastTypes = [
                  "showtime_cancelled", 
                  "movie_created", 
                  "movie_updated", 
                  "movie_deleted", 
                  "booking_paid", 
                  "booking_refunded",
                  "user_updated",
                  "user_deleted"
                ];
                if (!skipToastTypes.includes(incoming.type)) {
                  toast.success(incoming.title || "Có thông báo mới", { id: incoming.id });
                }
                if ((incoming.type === "showtime_expired" || incoming.type === "showtime_cancelled") && activeTab === "showtimes") {
                  getShowtimes()
                    .then((data) => setShowtimes(data))
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
        const [revenueData, bookingsData, comboData, timeslotsData, refundsData, topMoviesData] = await Promise.all([
          getRevenueReport(),
          getBookingsReport(),
          getComboRevenueReport(),
          getTimeslotsReport(),
          getRefundsReport(),
          getTopMoviesReport(),
        ]);
        if (cancelled) return;

        const byStatus = bookingsData.reduce((acc, item) => {
          acc[item._id] = item;
          return acc;
        }, {});

        setStats({
          totalRevenue: revenueData.summary?.totalRevenue || 0,
          totalBookings: revenueData.summary?.totalBookings || 0,
          pendingBookings: byStatus.pending?.count || 0,
          expiredBookings: byStatus.expired?.count || 0,
        });
        setExtStats({
          comboRevenue: comboData.totalComboRevenue || 0,
          comboItems: comboData.items || [],
          timeslots: timeslotsData || [],
          refunds: refundsData || { totalRefunds: 0, totalRefundAmount: 0 },
          topMovies: topMoviesData || [],
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
        getMovies(),
        getMovieGenres(),
      ])
        .then(([moviesData, genresData]) => {
          setMovies(moviesData);
          setGenreOptions(genresData);
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
      getAdminBookings()
        .then((bookingList) => {
          const transformed = bookingList.map((booking) => {
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
      getUsers()
        .then((data) => setUsers(data))
        .catch(() => toast.error("Không tải được danh sách thành viên"))
        .finally(() => setUsersLoading(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  // Fetch cinemas when needed (showtimes or rooms tabs)
  useEffect(() => {
    if (activeTab !== "rooms" || cinemas.length > 0) return;
    getCinemas().then((data) => setCinemas(data)).catch(() => { });
  }, [activeTab, cinemas.length]);

  // Fetch showtimes + cinemas + movies (dùng cho filter và modal)
  useEffect(() => {
    if (activeTab !== "showtimes") return;
    const timeoutId = window.setTimeout(() => {
      setShowtimesLoading(true);
      Promise.all([
        getShowtimes(),
        getCinemas(),
        getMovies(),
      ]).then(([stData, cinemasData, moviesData]) => {
        setShowtimes(stData);
        setCinemas(cinemasData);
        setMovies(moviesData);
      }).catch(() => toast.error("Không tải được danh sách suất chiếu"))
        .finally(() => setShowtimesLoading(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "showtimes") return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        const [stData, cinemasData, moviesData] = await Promise.all([
          getShowtimes(),
          getCinemas(),
          getMovies(),
        ]);

        setShowtimes(stData);
        setCinemas(cinemasData);
        setMovies(moviesData);
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

  const [bulkActing, setBulkActing] = useState(false);

  // Bulk cancel showtimes
  const handleBulkCancelShowtimes = async (ids) => {
    if (!ids?.length) return;
    setBulkActing(true);
    try {
      const data = await bulkCancelShowtimes(ids);
      setShowtimes((prev) => prev.map((s) => ids.includes(s._id) ? { ...s, status: "cancelled" } : s));
      toast.success(data?.message || `Đã hủy ${ids.length} suất chiếu`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Hủy suất chiếu thất bại");
    } finally {
      setBulkActing(false);
    }
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
        const resData = await updateMovie(currentMovie._id, data);
        const { movie, warning, affectedShowtimes } = resData;
        setMovies(movies.map((m) => (m._id === currentMovie._id ? movie : m)));
        if (warning && affectedShowtimes?.length > 0) {
          const msg = `${warning}. Bạn có muốn huỷ và hoàn tiền các suất chiếu bị ảnh hưởng không?`;
          if (window.confirm(msg)) {
            const ids = affectedShowtimes.filter(s => s.affectedBookings > 0).map(s => s._id);
            if (ids.length > 0) {
              await cancelAffectedShowtimes(currentMovie._id, ids);
              toast.success(`Đã hoàn tiền cho các đơn bị ảnh hưởng!`);
            }
          }
          toast(`⚠️ ${warning}`, { icon: "⚠️", duration: 6000 });
        } else {
          toast.success("Đã cập nhật phim!");
        }
      } else {
        const newMovie = await createMovie({ ...data, rating: 0 });
        setMovies([newMovie, ...movies]);
        toast.success("Đã thêm phim mới!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra, thử lại sau");
    }
    setIsModalOpen(false);
  };

  const handleViewTicket = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleConfirmOrder = async (bookingId) => {
    try {
      await confirmBooking(bookingId);
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
      const updatedUser = await updateUser(userId, data);
      setUsers(users.map((u) => (u._id === userId ? updatedUser : u)));
      toast.success("Đã cập nhật thành viên!");
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };


  const handlePrintTicket = async (bookingId) => {
    try {
      await printBooking(bookingId);
      setOrders(orders.map((o) =>
        o.bookingRawId === bookingId ? { ...o, ticketStatus: "printed" } : o
      ));
      toast.success("Đã đánh dấu vé đã in!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  };

  const handleCancelShowtime = async (showtime) => {
    try {
      await cancelShowtime(showtime._id);
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
    vouchers: "Quản Lý Voucher",
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 font-sans text-slate-900 dark:text-gray-100 overflow-hidden relative">
      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .tab-enter { animation: tabFadeIn 0.25s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notif-enter { animation: slideDown 0.2s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-[50] w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-700 transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:z-auto md:translate-x-0 md:block`}>
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        <header className="flex justify-between items-center px-4 md:px-8 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/50 dark:border-gray-700/50 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg">
              <Menu size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {tabTitle[activeTab] || "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-600 text-sm font-bold text-slate-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-[#dc2626] hover:border-red-200 transition-all"
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">Trang người dùng</span>
            </Link>
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={handleToggleNotifications}
                className="p-2.5 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl text-slate-500 dark:text-gray-400 hover:text-[#dc2626] hover:shadow-md transition-all relative"
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
                <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-2xl overflow-hidden z-40 notif-enter">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">Thông báo quản trị</p>
                      <p className="text-xs text-slate-400 dark:text-gray-500">Cập nhật theo thời gian thực</p>
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
                      <div className="px-4 py-10 text-center text-sm text-slate-400 dark:text-gray-500">
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
                          className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-gray-700 last:border-b-0 transition-colors ${item.data?.bookingCode ? "hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer" : "cursor-default"
                            } ${item.read ? "bg-white dark:bg-gray-800" : "bg-rose-50/50 dark:bg-rose-900/20"}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${item.read ? "bg-slate-200" : "bg-rose-500"}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{item.title}</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">{item.message}</p>
                              <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-2">
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
              <span className="hidden md:block text-sm font-bold text-slate-700 dark:text-gray-300">{adminUser?.name || "Admin"}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100 dark:bg-gray-900">
          <div key={activeTab} className="pb-10 tab-enter">
            {activeTab === "dashboard" && <DashboardStats stats={stats} extStats={extStats} loading={statsLoading} />}
            {activeTab === "movies" && (
              moviesLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent" /></div>
              ) : (
                <MoviesManager movies={movies} handleAddNew={handleAddNew} handleEdit={handleEdit} />
              )
            )}
            {activeTab === "users" && <UsersManager users={users} loading={usersLoading} onUpdate={handleUpdateUser} />}
            {activeTab === "showtimes" && (
              <ShowtimesManager
                showtimes={showtimes}
                loading={showtimesLoading}
                movies={movies.length > 0 ? movies : []}
                cinemas={cinemas}
                onAddNew={() => {
                  if (movies.length === 0) {
                    getMovies().then((data) => setMovies(data)).catch(() => { });
                  }
                  setIsShowtimeModalOpen(true);
                }}
                onCancel={handleCancelShowtime}
                onBulkCancel={handleBulkCancelShowtimes}
                isBulkActing={bulkActing}
              />
            )}
            {activeTab === "cinemas" && <CinemasManager />}
            {activeTab === "rooms" && (
              <RoomsManager cinemas={cinemas.length > 0 ? cinemas : []} />
            )}
            {activeTab === "orders" && (
              <OrdersManager orders={orders} loading={ordersLoading} onViewTicket={handleViewTicket} onConfirm={handleConfirmOrder} onPrint={handlePrintTicket} />
            )}
            {activeTab === "reviews" && <ReviewsManager />}
            {activeTab === "vouchers" && <VouchersManager />}
            {activeTab === "audit" && <AuditManager />}
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
            getShowtimes()
              .then((data) => setShowtimes(data))
              .finally(() => setShowtimesLoading(false));
          }}
        />
      )}
      {isOrderModalOpen && (
        <OrderDetailModal order={selectedOrder} onClose={() => setIsOrderModalOpen(false)} onPrint={handlePrintTicket} />
      )}
    </div>
  );
};

export default Dashboard;
