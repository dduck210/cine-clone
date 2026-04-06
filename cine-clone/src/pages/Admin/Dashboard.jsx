import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/admin/Sidebar";
import {
  Search,
  Bell,
  DollarSign,
  Ticket,
  Clock,
  User,
  MoreHorizontal,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { stats, moviesList as initialMovies } from "../../data/adminData";
import {
  OrdersManager,
  OrderDetailModal,
} from "../../components/admin/OrdersTab";
import { MoviesManager, MovieModal } from "../../components/admin/MoviesTab";

const toastConfig = { position: "top-right", toastOptions: { duration: 4000 } };
const DashboardView = () => <div>Dashboard</div>;
const UsersManager = () => <div>Users</div>;

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-64 bg-white border-r">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(t) => setSearchParams({ tab: t })}
        />
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center px-4 md:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-white/50 sticky top-0 z-30 shadow-sm shrink-0">
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-800 capitalize tracking-tight flex items-center gap-2">
              {activeTab === "dashboard"
                ? "Tổng Quan"
                : activeTab === "movies"
                  ? "Quản Lý Phim"
                  : activeTab === "orders"
                    ? "Đơn Hàng"
                    : "Thành Viên"}
            </h1>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <Toaster {...toastConfig} />
        </div>
      </main>
    </div>
  );
};
export default Dashboard;
