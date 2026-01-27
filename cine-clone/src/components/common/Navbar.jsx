import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogOut, History, Gift, Award } from "lucide-react";
import AuthModal from "../auth/AuthModal";

const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setIsDropdownOpen(false);
    navigate("/");
  };

  return (
    <>
      <nav className="font-bromega bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-ticket transform group-hover:-rotate-12 transition-transform duration-300"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
              <path d="M13 5v2"></path>
              <path d="M13 17v2"></path>
              <path d="M13 11v2"></path>
            </svg>

            <span className="text-2xl font-black text-[#dc2626] tracking-tight">
              5Cine
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-gray-600 font-bold hover:text-[#dc2626] transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              to="/movies"
              className="text-gray-600 font-bold hover:text-[#dc2626] transition-colors"
            >
              Phim
            </Link>
            <Link
              to="/cinemas"
              className="text-gray-600 font-bold hover:text-[#dc2626] transition-colors"
            >
              Rạp chiếu
            </Link>
            <Link
              to="/promotions"
              className="text-gray-600 font-bold hover:text-[#dc2626] transition-colors"
            >
              Khuyến mãi
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-4 py-2 w-48 lg:w-64 border border-transparent focus-within:border-[#dc2626] focus-within:bg-white transition-all">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phim..."
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-700 placeholder-gray-400 font-bromega font-thin"
              />
            </div>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 hover:bg-gray-50 py-1 px-2 rounded-lg transition-colors focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 overflow-hidden">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-gray-400" size={24} />
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-gray-700 text-sm">
                        {currentUser.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center text-yellow-600 font-bold">
                        <Award size={12} className="mr-1" /> {currentUser.rank}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="flex items-center text-orange-500 font-bold">
                        <Gift size={12} className="mr-1" /> {currentUser.points}{" "}
                        Stars
                      </span>
                    </div>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors"
                      >
                        <User size={18} className="text-[#dc2626]" /> Tài Khoản
                      </Link>
                      <Link
                        to="/my-tickets"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors"
                      >
                        <History size={18} className="text-[#dc2626]" /> Lịch Sử
                        Đặt vé
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-bold transition-colors text-left"
                      >
                        <LogOut size={18} /> Đăng Xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 text-gray-700 font-bold hover:text-[#dc2626] transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <User size={20} />
                <span className="hidden sm:inline font-bold">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Navbar;
