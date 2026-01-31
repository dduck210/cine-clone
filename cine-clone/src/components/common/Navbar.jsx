import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, LogOut, History, Menu, X } from "lucide-react";
import AuthModal from "../auth/AuthModal";

const Navbar = () => {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setIsDropdownOpen(false);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Phim", path: "/movies" },
    { name: "Rạp chiếu", path: "/cinemas" },
    { name: "Khuyến mãi", path: "/promotions" },
  ];

  return (
    <>
      <nav className="font-bromega bg-white/95 backdrop-blur-md border-b border-gray-100 fixed top-0 left-0 w-full z-[100] shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between gap-2">
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 group transition-transform active:scale-95"
          >
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
                className="md:w-10 md:h-10 transform group-hover:-rotate-12 transition-transform duration-300"
              >
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
            </div>
            <span className="text-xl md:text-2xl font-black text-[#dc2626] tracking-tight">
              5Cine
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-600 font-bold hover:text-[#dc2626] transition-colors text-sm lg:text-base"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-4 py-2 w-32 lg:w-64 border border-transparent focus-within:border-[#dc2626] focus-within:bg-white transition-all">
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-transparent border-none outline-none text-xs ml-2 w-full text-gray-700 placeholder-gray-400 font-bold"
              />
            </div>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 p-1 md:px-2 md:py-1 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 border border-gray-300 overflow-hidden flex-shrink-0">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="text-gray-400 p-1" size={24} />
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="font-bold text-gray-700 text-sm leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-yellow-600 font-black uppercase">
                      {currentUser.rank}
                    </p>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-14 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold"
                      >
                        <User size={18} className="text-[#dc2626]" /> Tài Khoản
                      </Link>
                      <Link
                        to="/my-tickets"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold"
                      >
                        <History size={18} className="text-[#dc2626]" /> Lịch Sử
                        Vé
                      </Link>

                      {currentUser.rank === "ADMIN" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-[#dc2626]"
                          >
                            <rect
                              width="18"
                              height="18"
                              x="3"
                              y="3"
                              rx="2"
                              ry="2"
                            />
                            <path d="M9 3v18" />
                            <path d="m14 9 3 3-3 3" />
                          </svg>
                          Quản trị
                        </Link>
                      )}

                      <div className="border-t border-gray-100 mx-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-bold transition-colors"
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
                className="flex items-center gap-2 text-gray-700 font-bold hover:text-[#dc2626] p-2 rounded-lg transition-all active:scale-95"
              >
                <User size={22} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>

        <div
          className={`md:hidden bg-white border-t border-gray-50 transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? "max-h-[400px] border-b shadow-lg" : "max-h-0"
          }`}
        >
          <div className="p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 font-bold hover:bg-red-50 hover:text-[#dc2626] rounded-xl transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-2">
              <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 w-full border border-gray-200">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phim..."
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {(isDropdownOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/5 md:bg-transparent"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsMobileMenuOpen(false);
          }}
        ></div>
      )}
    </>
  );
};

export default Navbar;
