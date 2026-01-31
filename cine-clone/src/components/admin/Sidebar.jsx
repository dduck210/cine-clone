import React from "react";
import {
  LayoutDashboard,
  Film,
  Calendar,
  ShoppingCart,
  Users,
  Settings,
  Ticket,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, setIsOpen, activeTab, onTabChange }) => {
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "movies", icon: Film, label: "Movies" },
    { id: "schedules", icon: Calendar, label: "Schedules" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "users", icon: Users, label: "Users" },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col z-[90] transition-transform duration-300
        w-64 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="p-6 flex items-center justify-between border-b">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
            <Ticket size={28} />
            <span>5Cine</span>
          </div>
          <button
            className="lg:hidden text-gray-400"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto hide-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
