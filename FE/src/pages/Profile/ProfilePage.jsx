import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";
import {
  User,
  Mail,
  Phone,
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
    phone: storedUser?.phone || "",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(storedUser?.name || "U")}&background=dc2626&color=fff&bold=true`,
    rank: storedUser?.role === "admin" ? "ADMIN" : "Star",
    points: 0,
    nextRankPoints: 1000,
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

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

              <h2 className="relative z-10 text-xl font-bold text-gray-800">{user.name}</h2>

              <div className="relative z-10 flex items-center gap-2 mt-2">
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-yellow-200">
                  <Star size={12} fill="currentColor" /> {user.rank} Member
                </span>
              </div>

              <div className="relative z-10 w-full mt-6 text-left bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500 font-medium">Điểm tích lũy</span>
                  <span className="font-bold text-red-600">{user.points} / {user.nextRankPoints}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-600 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${(user.points / user.nextRankPoints) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  Cần thêm <span className="font-bold text-gray-600">{user.nextRankPoints - user.points} điểm</span> để thăng hạng Gold
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <MenuButton active={activeTab === "info"} onClick={() => setActiveTab("info")} icon={<User size={18} />} label="Thông tin tài khoản" />
              <MenuButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={18} />} label="Lịch sử giao dịch" />
              <MenuButton active={activeTab === "password"} onClick={() => setActiveTab("password")} icon={<Lock size={18} />} label="Đổi mật khẩu" />
            </div>
          </div>

          {/* Cột phải */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
              {activeTab === "info" && <PersonalInfoTab storedUser={storedUser} />}
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
    <div className="flex items-center gap-3">{icon} {label}</div>
    <ChevronRight size={16} className={`transition-transform ${active ? "text-red-600" : "text-gray-400"}`} />
  </button>
);

const PHONE_RE = /^(0[3-9]\d{8})$/;

const PersonalInfoTab = ({ storedUser }) => {
  const [form, setForm] = useState({
    name: storedUser?.name || "",
    phone: storedUser?.phone || "",
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
    else if (form.name.trim().length < 2) errs.name = "Họ tên phải có ít nhất 2 ký tự";
    if (form.phone && !PHONE_RE.test(form.phone.replace(/\s/g, "")))
      errs.phone = "Số điện thoại không hợp lệ (VD: 0912345678)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await axiosInstance.put("/auth/profile", { name: form.name, phone: form.phone });
      const fresh = JSON.parse(localStorage.getItem("currentUser") || "{}");
      localStorage.setItem("currentUser", JSON.stringify({ ...fresh, name: res.data.name, phone: res.data.phone }));
      setForm({ name: res.data.name, phone: res.data.phone || "" });
      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại, thử lại sau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1 border-l-4 border-red-600 pl-3">Thông Tin Chung</h2>
      <p className="text-sm text-gray-500 mb-8 pl-4">Quản lý thông tin hồ sơ của bạn để bảo mật tài khoản</p>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className={`absolute left-3 top-3 ${errors.name ? "text-red-400" : "text-gray-400"}`} size={18} />
            <input
              type="text"
              value={form.name}
              onChange={setField("name")}
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium ${errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-[#dc2626] focus:ring-red-100"}`}
            />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
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

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Số điện thoại</label>
          <div className="relative">
            <Phone className={`absolute left-3 top-3 ${errors.phone ? "text-red-400" : "text-gray-400"}`} size={18} />
            <input
              type="tel"
              value={form.phone}
              onChange={setField("phone")}
              placeholder="VD: 0912345678"
              maxLength={10}
              className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-sm font-medium ${errors.phone ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "border-gray-200 focus:border-[#dc2626] focus:ring-red-100"}`}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
        </div>

        <div className="md:col-span-2 mt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 ${saving ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-red-200"}`}
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
  paid: { label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
  pending: { label: "Chờ thanh toán", color: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
};

const HistoryTab = ({ navigate }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/bookings/user/all")
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetail = (booking) => {
    const showtime = booking.showtime || {};
    const movie = showtime.movie || {};
    const cinema = showtime.cinema || {};
    navigate("/payment-success", {
      state: {
        movieTitle: movie.title || "Phim",
        cinemaName: cinema.name || "5Cine",
        showTime: showtime.startTime || "",
        showDate: showtime.date ? new Date(showtime.date).toLocaleDateString("vi-VN") : "",
        showAddress: cinema.address || "",
        selectedSeats: booking.seatNumbers || [],
        combos: [],
        finalTotalPrice: booking.totalPrice,
        poster: movie.poster || "",
        orderId: booking.bookingCode,
        isHistoryMode: true,
        bookingStatus: booking.status,
        paymentMethod: booking.paymentId?.method || "",
      },
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-3">Lịch Sử Giao Dịch</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <Ticket size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Bạn chưa có giao dịch nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-bold">Mã vé</th>
                <th className="p-4 font-bold">Phim</th>
                <th className="p-4 font-bold">Ngày chiếu</th>
                <th className="p-4 font-bold">Rạp</th>
                <th className="p-4 font-bold">Tổng tiền</th>
                <th className="p-4 font-bold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {bookings.map((b) => {
                const showtime = b.showtime || {};
                const movie = showtime.movie || {};
                const cinema = showtime.cinema || {};
                const status = statusMap[b.status] || { label: b.status, color: "bg-gray-100 text-gray-500" };
                return (
                  <tr
                    key={b._id}
                    onClick={() => handleViewDetail(b)}
                    className="border-b border-gray-100 hover:bg-red-50/50 transition-colors cursor-pointer"
                  >
                    <td className="p-4 font-bold text-red-600 font-mono text-xs">{b.bookingCode || b._id?.toString().slice(-8)}</td>
                    <td className="p-4 font-semibold text-gray-800">{movie.title || "—"}</td>
                    <td className="p-4 text-gray-600 text-xs">
                      {showtime.date ? new Date(showtime.date).toLocaleDateString("vi-VN") : "—"}
                      {showtime.startTime ? ` · ${showtime.startTime}` : ""}
                    </td>
                    <td className="p-4 text-gray-600 text-xs">{cinema.name || "—"}</td>
                    <td className="p-4 font-bold text-gray-800">{b.totalPrice?.toLocaleString()}đ</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${status.color}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ChangePasswordTab = () => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
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

  const PasswordField = ({ label, field, showKey }) => (
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

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-1 border-l-4 border-red-600 pl-3">Đổi Mật Khẩu</h2>
      <p className="text-sm text-gray-500 mb-8 pl-4">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <PasswordField label="Mật khẩu hiện tại" field="currentPassword" showKey="current" />
        <PasswordField label="Mật khẩu mới" field="newPassword" showKey="newPass" />
        <PasswordField label="Xác nhận mật khẩu mới" field="confirmPassword" showKey="confirm" />

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className={`font-bold py-3 px-6 rounded-lg shadow-md transition-colors w-full sm:w-auto flex items-center gap-2 justify-center ${saving ? "bg-red-400 cursor-not-allowed text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
          >
            {saving ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : <Lock size={18} />}
            {saving ? "Đang cập nhật..." : "Cập Nhật Mật Khẩu"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
