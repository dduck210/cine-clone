import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, User, LogOut, History, Menu, X, ChevronDown, LayoutDashboard, Ticket } from "lucide-react";
import AuthModal from "../auth/AuthModal";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    if (user.role === "admin") navigate("/admin");
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    toast.success("Đăng xuất thành công!", { duration: 2000 });
    setTimeout(() => {
      setCurrentUser(null);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      navigate("/");
    }, 800);
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

          <button
            onClick={() => navigate("/", { state: { splashTs: Date.now() } })}
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
            <span className="text-xl md:text-2xl font-black text-[#dc2626] tracking-tight leading-none pt-1">
              5Cine
            </span>
          </button>

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
            <form
              className="hidden sm:flex items-center bg-gray-100 rounded-full px-4 py-2 w-32 lg:w-64 border border-transparent focus-within:border-[#dc2626] focus-within:bg-white transition-all"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/movies?q=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchQuery("");
                  setIsMobileMenuOpen(false);
                }
              }}
            >
              <Search size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm phim..."
                className="bg-transparent border-none outline-none text-xs ml-2 w-full text-gray-700 placeholder-gray-400 font-bold"
              />
            </form>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl border transition-all duration-200 ${
                    isDropdownOpen
                      ? "bg-red-50 border-red-200 shadow-sm"
                      : "bg-gray-50 border-gray-200 hover:border-red-200 hover:bg-red-50"
                  }`}
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#dc2626] shadow-sm">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-black text-sm leading-none select-none">
                        {currentUser.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-bold text-gray-700 max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`hidden lg:block text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-br from-red-50 to-orange-50 border-b border-red-100/60">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#dc2626] flex items-center justify-center shadow-sm flex-shrink-0">
                          <span className="text-white font-black text-sm leading-none select-none">
                            {currentUser.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">{currentUser.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                          <User size={14} className="text-gray-500 group-hover:text-[#dc2626] transition-colors" />
                        </div>
                        Tài khoản
                      </Link>
                      <Link
                        to="/my-tickets"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                          <Ticket size={14} className="text-gray-500 group-hover:text-[#dc2626] transition-colors" />
                        </div>
                        Vé của tôi
                      </Link>

                      {currentUser.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                            <LayoutDashboard size={14} className="text-gray-500 group-hover:text-[#dc2626] transition-colors" />
                          </div>
                          Quản trị
                        </Link>
                      )}
                    </div>

                    <div className="px-1.5 pb-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-500 text-sm font-semibold transition-colors group border-t border-gray-100 pt-2.5 mt-0.5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                          <LogOut size={14} className="text-red-400 group-hover:text-red-600 transition-colors" />
                        </div>
                        Đăng xuất
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

        {/* MENU MOBILE EXPAND */}
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
              <form
                className="flex items-center bg-gray-100 rounded-xl px-4 py-3 w-full border border-gray-200"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(`/movies?q=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery("");
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm phim..."
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full font-bold"
                />
              </form>
            </div>
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Overlay */}
      {(isDropdownOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/5 md:bg-transparent"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsMobileMenuOpen(false);
          }}
        ></div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mx-auto mb-4">
              <LogOut size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-1">Đăng xuất?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Bạn có chắc muốn đăng xuất khỏi tài khoản không?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-[#dc2626] text-white font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
