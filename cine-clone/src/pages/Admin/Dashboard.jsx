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

const toastConfig = {
  position: "top-right",
  toastOptions: {
    duration: 4000,
    className:
      "!bg-white !text-slate-800 !shadow-2xl !rounded-xl !border !border-slate-100 !font-medium",
  },
};

const DashboardView = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {stats.map((stat, index) => (
      <div
        key={index}
        className="bg-white p-6 rounded-2xl border hover:shadow-lg transition-all"
      >
        <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
          {stat.value}
        </h3>
      </div>
    ))}
  </div>
);

const UsersManager = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Thành viên hệ thống</h2>
  </div>
);

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      <aside
        className={`fixed inset-y-0 left-0 z-[50] w-64 bg-white border-r transition-transform md:relative md:translate-x-0 md:block`}
      >
        <Sidebar
          activeTab={activeTab}
          onTabChange={(t) => setSearchParams({ tab: t })}
        />
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        <header className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
          <h1 className="text-lg font-extrabold text-slate-800">
            Quản Trị Tạm Thời
          </h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Toaster {...toastConfig} />
        </div>
      </main>
    </div>
  );
};
export default Dashboard;
