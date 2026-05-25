import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Camera,
  Star,
  Lock,
  History,
  ChevronRight,
  Save,
  Eye,
  EyeOff,
  Ticket,
  MapPin,
  Calendar,
  Clock,
} from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");

  const storedUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  useEffect(() => {
    if (!storedUser) navigate("/");
  }, []);

  const user = {
    name: storedUser?.name || "Người dùng",
    email: storedUser?.email || "",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(storedUser?.name || "U")}&background=dc2626&color=fff&bold=true`,
    rank: storedUser?.role === "admin" ? "ADMIN" : "Star",
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 md:pt-28 pb-12 max-w-6xl">
        <div className="text-sm text-gray-500 mb-6">
          Trang chủ /{" "}
          <span className="text-gray-900 font-medium">Tài khoản của tôi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Cột trái */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-red-50 to-orange-50 z-0"></div>

              <div className="relative z-10 mb-3 group cursor-pointer mt-4">
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <div className="absolute bottom-0 right-0 bg-gray-900 text-white p-1.5 rounded-full border-2 border-white hover:bg-red-600 transition-colors">
                    <Camera size={14} />
                  </div>
                </div>
              </div>

              <h2 className="relative z-10 text-xl font-bold text-gray-800">
                {user.name}
              </h2>

              <div className="relative z-10 flex items-center gap-2 mt-2">
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-yellow-200">
                  <Star size={12} fill="currentColor" /> {user.rank} Member
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <MenuButton
                active={activeTab === "info"}
                onClick={() => setActiveTab("info")}
                icon={<User size={18} />}
                label="Thông tin tài khoản"
              />
              <MenuButton
                active={activeTab === "history"}
                onClick={() => setActiveTab("history")}
                icon={<History size={18} />}
                label="Lịch sử giao dịch"
              />
              <MenuButton
                active={activeTab === "password"}
                onClick={() => setActiveTab("password")}
                icon={<Lock size={18} />}
                label="Đổi mật khẩu"
              />
            </div>
          </div>

          {/* Cột phải */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
              {activeTab === "info" && (
                <PersonalInfoTab storedUser={storedUser} />
              )}
              {activeTab === "history" && <HistoryTab navigate={navigate} />}
              {activeTab === "password" && <ChangePasswordTab />}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const MenuButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 text-sm font-medium transition-all duration-200 border-b border-gray-50 last:border-0
      ${active ? "bg-red-50 text-red-600 border-l-4 border-l-red-600 pl-3" : "text-gray-600 hover:bg-gray-50 border-l-4 border-l-transparent pl-4"}`}
  >
    <div className="flex items-center gap-3">
      {icon} {label}
    </div>
    <ChevronRight
      size={16}
      className={`transition-transform ${active ? "text-red-600" : "text-gray-400"}`}
    />
  </button>
);

const PersonalInfoTab = ({ storedUser }) => {
  const [form, setForm] = useState({
    name: storedUser?.name || "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const setField = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Họ tên không được để trống";
    else if (form.name.trim().length < 2)
      errs.name = "Họ tên phải có ít nhất 2 ký tự";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await axiosInstance.put("/auth/profile", {
        name: form.name,
      });
      const fresh = JSON.parse(localStorage.getItem("currentUser") || "{}");
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          ...fresh,
          name: res.data.name,
        }),
      );
      setForm({ name: res.data.name });
      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Cập nhật thất bại, thử lại sau",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1 border-l-4 border-red-600 pl-3">
        Thông Tin Chung
      </h2>
      <p className="text-sm text-gray-500 mb-8 pl-4">
        Quản lý thông tin hồ sơ của bạn để bảo mật tài khoản
      </p>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User
              className={`absolute left-3 top-3 ${errors.name ? "text-red-400" : "text-gray-400"}`}
              size={18}
            />
            <input
              type="text"
              value={form.name}
              onChange={setField("name")}
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium ${errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-[#dc2626] focus:ring-red-100"}`}
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              value={storedUser?.email || ""}
              disabled
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
            />
          </div>
          <p className="text-xs text-gray-400">Email không thể thay đổi</p>
        </div>

        <div className="md:col-span-2 mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 ${saving ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-red-200"}`}
          >
            {saving ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Save size={18} />
            )}
            {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
        </div>
      </form>
    </div>
  );
};

const statusMap = {
  paid: {
    label: "Đã thanh toán",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Chờ thanh toán",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  cancelled: {
    label: "Đã hủy",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  expired: {
    label: "Đã hết hạn",
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  refunded: {
    label: "Đã hoàn tiền",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
};

const HistoryTab = ({ navigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/bookings/user/all").then((res) => setBookings(res.data)).catch(() => setBookings([])),
      new Promise((r) => setTimeout(r, 1000)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleViewDetail = (booking) => {
    const showtime = booking.showtime || {};
    const movie = showtime.movie || {};
    const cinema = showtime.cinema || {};
    const sharedState = {
      movieTitle: movie.title || "Phim",
      cinemaName: cinema.name || "5Cine",
      roomName: showtime.room?.name || "",
      showTime: showtime.startTime || "",
      showDate: showtime.date ? new Date(showtime.date).toLocaleDateString("vi-VN") : "",
      showAddress: cinema.address || "",
      selectedSeats: booking.seatNumbers || [],
      combos: booking.extraItems || [],
      finalTotalPrice: booking.totalPrice,
      poster: movie.poster || "",
      duration: movie.duration || 0,
    };

    if (booking.status === "pending") {
      navigate("/payment", {
        state: { ...sharedState, existingBookingId: booking._id, existingBookingCode: booking.bookingCode },
      });
      return;
    }

    navigate("/payment-success", {
      state: {
        ...sharedState,
        orderId: booking.bookingCode,
        bookingId: booking._id,
        isHistoryMode: true,
        bookingStatus: booking.status,
        ticketStatus: booking.ticketStatus || "not_printed",
        paymentMethod: booking.paymentId?.method || "",
      },
    });
  };

  const paidBookings = bookings.filter(
    (b) => b.status === "paid" || b.status === "success",
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 border-l-4 border-red-600 pl-3">
          Lịch sử giao dịch
        </h2>
        {paidBookings.length > 0 && (
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {paidBookings.length} giao dịch
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : paidBookings.length === 0 ? (
        <div className="text-center py-16">
          <Ticket size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            Bạn chưa có giao dịch nào.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paidBookings.map((b) => {
            const showtime = b.showtime || {};
            const movie = showtime.movie || {};
            const cinema = showtime.cinema || {};
            const status = statusMap[b.status] || {
              label: b.status,
              bg: "bg-gray-100",
              text: "text-gray-500",
              border: "border-gray-200",
              dot: "bg-gray-400",
            };
            const dateStr = showtime.date
              ? new Date(showtime.date).toLocaleDateString("vi-VN")
              : null;

            return (
              <div
                key={b._id}
                onClick={() => handleViewDetail(b)}
                className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-red-50/60 border border-gray-100 hover:border-red-200 rounded-2xl cursor-pointer transition-all group"
              >
                {/* Poster */}
                <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 shadow-sm">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Ticket size={16} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate group-hover:text-red-600 transition-colors">
                    {movie.title || "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={11} /> {cinema.name || "—"}
                    </span>
                    {dateStr && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> {dateStr}
                        {showtime.startTime ? ` · ${showtime.startTime}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-gray-300 mt-1 truncate">
                    #{b.bookingCode || b._id?.toString().slice(-8)}
                  </p>
                </div>

                {/* Right: price + status */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="font-black text-gray-800 text-sm">
                    {b.totalPrice?.toLocaleString()}đ
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${status.bg} ${status.text} ${status.border}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`}
                    />
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PasswordField = ({
  label,
  field,
  showKey,
  form,
  setForm,
  show,
  setShow,
}) => (
  <div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
      <input
        type={show[showKey] ? "text" : "password"}
        value={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        placeholder={`Nhập ${label.toLowerCase()}`}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#dc2626] focus:ring-2 focus:ring-red-100 transition-all text-sm"
      />
      <button
        type="button"
        onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
      >
        {show[showKey] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

const ChangePasswordTab = () => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.put("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-1 border-l-4 border-red-600 pl-3">
        Đổi Mật Khẩu
      </h2>
      <p className="text-sm text-gray-500 mb-8 pl-4">
        Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField
          label="Mật khẩu hiện tại"
          field="currentPassword"
          showKey="current"
          form={form}
          setForm={setForm}
          show={show}
          setShow={setShow}
        />
        <PasswordField
          label="Mật khẩu mới"
          field="newPassword"
          showKey="newPass"
          form={form}
          setForm={setForm}
          show={show}
          setShow={setShow}
        />
        <PasswordField
          label="Xác nhận mật khẩu mới"
          field="confirmPassword"
          showKey="confirm"
          form={form}
          setForm={setForm}
          show={show}
          setShow={setShow}
        />

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`font-bold py-3 px-6 rounded-lg shadow-md transition-colors w-full sm:w-auto flex items-center gap-2 justify-center ${saving ? "bg-red-400 cursor-not-allowed text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
          >
            {saving ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Lock size={18} />
            )}
            {saving ? "Đang cập nhật..." : "Cập Nhật Mật Khẩu"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
