import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/shared/components/common/Navbar";
import Footer from "@/shared/components/common/Footer";
import { User, Camera, Star, Lock, History, ChevronRight, Heart } from "lucide-react";
import ProfileInfoTab from "@/features/profile/components/ProfileInfoTab";
import OrderHistoryTab from "@/features/profile/components/OrderHistoryTab";
import WishlistTab from "@/features/profile/components/WishlistTab";
import ChangePasswordTab from "@/features/profile/components/ChangePasswordTab";

const TABS = [
  { id: "info",     icon: <User size={18} />,    label: "Thông tin tài khoản" },
  { id: "history",  icon: <History size={18} />,  label: "Lịch sử giao dịch" },
  { id: "wishlist", icon: <Heart size={18} />,    label: "Phim yêu thích" },
  { id: "password", icon: <Lock size={18} />,     label: "Đổi mật khẩu" },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const storedUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  useEffect(() => { if (!storedUser) navigate("/"); }, []);

  const user = {
    name: storedUser?.name || "Người dùng",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(storedUser?.name || "U")}&background=dc2626&color=fff&bold=true`,
    rank: storedUser?.role === "admin" ? "ADMIN" : "Star",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-white">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 md:pt-28 pb-12 max-w-6xl">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Trang chủ / <span className="text-gray-900 dark:text-white font-medium">Tài khoản của tôi</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            {/* Avatar card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 z-0" />
              <div className="relative z-10 mb-3 group cursor-pointer mt-4">
                <div className="relative">
                  <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
                  <div className="absolute bottom-0 right-0 bg-gray-900 dark:bg-gray-700 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-600 hover:bg-red-600 transition-colors">
                    <Camera size={14} />
                  </div>
                </div>
              </div>
              <h2 className="relative z-10 text-xl font-bold text-gray-800 dark:text-white">{user.name}</h2>
              <div className="relative z-10 flex items-center gap-2 mt-2">
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-yellow-200">
                  <Star size={12} fill="currentColor" /> {user.rank} Member
                </span>
              </div>
            </div>

            {/* Tab nav */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {TABS.map(({ id, icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center justify-between p-4 text-sm font-medium transition-all duration-200 border-b border-gray-50 dark:border-gray-700 last:border-0 ${
                    activeTab === id
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 border-l-4 border-l-red-600 pl-3"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-l-transparent pl-4"
                  }`}
                >
                  <div className="flex items-center gap-3">{icon} {label}</div>
                  <ChevronRight size={16} className={`transition-transform ${activeTab === id ? "text-red-600" : "text-gray-400"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 min-h-[500px]">
              {activeTab === "info"     && <ProfileInfoTab storedUser={storedUser} />}
              {activeTab === "history"  && <OrderHistoryTab />}
              {activeTab === "wishlist" && <WishlistTab />}
              {activeTab === "password" && <ChangePasswordTab />}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
