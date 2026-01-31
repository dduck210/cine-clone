import React, { useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Star,
  Gift,
  Lock,
  History,
  ChevronRight,
  Save,
  Ticket,
} from "lucide-react";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState("info");

  const user = {
    name: "Dương Anh Đức",
    email: "admin@gmail.com",
    avatar: "https://ui-avatars.com/api/?name=Duong+Anh+Duc&background=random",
    rank: "Star",
    points: 125,
    nextRankPoints: 1000,
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="text-sm text-gray-500 mb-6">
          Trang chủ /{" "}
          <span className="text-gray-900 font-medium">Tài khoản của tôi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
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

              <div className="relative z-10 w-full mt-6 text-left bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500 font-medium">
                    Điểm tích lũy
                  </span>
                  <span className="font-bold text-red-600">
                    {user.points} / {user.nextRankPoints}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-600 h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(user.points / user.nextRankPoints) * 100}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  Cần thêm{" "}
                  <span className="font-bold text-gray-600">
                    {user.nextRankPoints - user.points} điểm
                  </span>{" "}
                  để thăng hạng Gold
                </p>
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

          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
              {activeTab === "info" && <PersonalInfoTab />}

              {activeTab === "history" && <HistoryTab />}

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
        ${
          active
            ? "bg-red-50 text-red-600 border-l-4 border-l-red-600 pl-3"
            : "text-gray-600 hover:bg-gray-50 border-l-4 border-l-transparent pl-4"
        }`}
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

const PersonalInfoTab = () => {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-1 border-l-4 border-red-600 pl-3">
        Thông Tin Chung
      </h2>
      <p className="text-sm text-gray-500 mb-8 pl-4">
        Quản lý thông tin hồ sơ của bạn để bảo mật tài khoản
      </p>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Họ và tên
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              defaultValue="Dương Anh Đức"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              defaultValue="admin@gmail.com"
              disabled
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Số điện thoại
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="tel"
              defaultValue="0987654321"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Ngày sinh
          </label>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />
            <input
              type="date"
              defaultValue="2000-01-01"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Giới tính
          </label>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="gender"
                defaultChecked
                className="w-4 h-4 text-red-600 focus:ring-red-600 border-gray-300"
              />
              <span className="text-sm text-gray-600 group-hover:text-red-600 transition-colors">
                Nam
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="gender"
                className="w-4 h-4 text-red-600 focus:ring-red-600 border-gray-300"
              />
              <span className="text-sm text-gray-600 group-hover:text-red-600 transition-colors">
                Nữ
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="gender"
                className="w-4 h-4 text-red-600 focus:ring-red-600 border-gray-300"
              />
              <span className="text-sm text-gray-600 group-hover:text-red-600 transition-colors">
                Khác
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Tỉnh/Thành phố
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
            <select className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm font-medium appearance-none">
              <option>Hà Nội</option>
              <option>Hồ Chí Minh</option>
              <option>Đà Nẵng</option>
            </select>
            <ChevronRight
              className="absolute right-3 top-3 text-gray-400 rotate-90"
              size={16}
            />
          </div>
        </div>

        <div className="md:col-span-2 mt-4 flex justify-end">
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-red-200 transition-all transform hover:-translate-y-1">
            <Save size={18} />
            Lưu Thay Đổi
          </button>
        </div>
      </form>
    </div>
  );
};

const HistoryTab = () => {
  const tickets = [
    {
      id: "#83211",
      movie: "Mai",
      date: "2025-05-20 19:30",
      seat: "F12, F13",
      cinema: "5Cine Cầu Giấy",
      total: "220.000đ",
      status: "Thành công",
    },
    {
      id: "#83005",
      movie: "Dune: Hành Tinh Cát 2",
      date: "2025-04-12 20:00",
      seat: "J05",
      cinema: "5Cine Mỹ Đình",
      total: "110.000đ",
      status: "Thành công",
    },
    {
      id: "#81002",
      movie: "Kung Fu Panda 4",
      date: "2025-03-08 18:15",
      seat: "E08, E09, E10",
      cinema: "5Cine Cầu Giấy",
      total: "330.000đ",
      status: "Đã hủy",
    },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-3">
        Lịch Sử Giao Dịch
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
              <th className="p-4 font-bold">Mã vé</th>
              <th className="p-4 font-bold">Phim</th>
              <th className="p-4 font-bold">Ngày giờ</th>
              <th className="p-4 font-bold">Rạp</th>
              <th className="p-4 font-bold">Tổng tiền</th>
              <th className="p-4 font-bold">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {tickets.map((t, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 hover:bg-red-50/50 transition-colors"
              >
                <td className="p-4 font-bold text-red-600">{t.id}</td>
                <td className="p-4 font-semibold text-gray-800">{t.movie}</td>
                <td className="p-4 text-gray-600">{t.date}</td>
                <td className="p-4 text-gray-600">{t.cinema}</td>
                <td className="p-4 font-bold text-gray-800">{t.total}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold 
                                        ${t.status === "Thành công" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ChangePasswordTab = () => {
  return (
    <div className="animate-fade-in max-w-lg">
      <h2 className="text-xl font-bold text-gray-800 mb-1 border-l-4 border-red-600 pl-3">
        Đổi Mật Khẩu
      </h2>
      <p className="text-sm text-gray-500 mb-8 pl-4">
        Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác
      </p>

      <form className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm"
            />
          </div>
        </div>

        <div className="pt-4">
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors w-full sm:w-auto">
            Cập Nhật Mật Khẩu
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
