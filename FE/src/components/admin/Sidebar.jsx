import React from "react";
import {
  LayoutDashboard,
  Film,
  Users,
  CalendarDays,
  ShoppingCart,
  LogOut,
  Grid,
} from "lucide-react";

const Sidebar = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "movies", label: "Quản lý Phim", icon: Film },
    { id: "showtimes", label: "Suất chiếu", icon: CalendarDays },
    { id: "rooms", label: "Phòng & Ghế", icon: Grid },
    { id: "orders", label: "Đơn đặt vé", icon: ShoppingCart },
    { id: "users", label: "Người dùng", icon: Users },
  ];

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 font-sans">
      <div className="h-20 flex items-center justify-center border-b border-slate-50">
        <div className="flex items-center gap-2 group cursor-pointer select-none">
          <div className="text-[#dc2626]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transform group-hover:-rotate-12 transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
          </div>
          <span className="text-2xl font-black text-[#dc2626] tracking-tight leading-none pt-1">
            5Cine
          </span>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="mb-4 px-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
          Menu Chính
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl 
                font-bold text-sm transition-all duration-300 ease-out group
                outline-none focus:outline-none
                active:scale-[0.98] 
                ${
                  isActive
                    ? "bg-[#dc2626] text-white shadow-lg shadow-red-200 translate-x-2"
                    : "text-slate-500 hover:bg-red-50 hover:text-[#dc2626] hover:translate-x-1"
                }
              `}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={`
                  transition-transform duration-300
                  ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-[#dc2626] group-hover:scale-110 group-hover:-rotate-6"
                  }
                `}
              />

              <span className="relative z-10">{item.label}</span>

              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-sm animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-50">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");
            window.location.href = "/";
          }}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-red-50 hover:text-[#dc2626] rounded-2xl transition-all duration-300 hover:shadow-sm group active:scale-[0.98]"
        >
          <LogOut
            size={20}
            className="group-hover:translate-x-1 transition-transform duration-300"
          />
          <span className="font-bold text-sm">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
