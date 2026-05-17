import React, { useEffect, useState, useRef, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/Home/HomePage";
import MovieDetailPage from "./pages/Movie/MovieDetailPage";
import BookingPage from "./pages/Booking/BookingPage";
import PaymentPage from "./pages/Payment/PaymentPage";
import PaymentSuccessPage from "./pages/Payment/PaymentSuccessPage";
import MyTicketsPage from "./pages/Ticket/MyTicketsPage";
import Dashboard from "./pages/Admin/Dashboard";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import MoviesPage from "./pages/MoviesPage";
import CinemasPage from "./pages/CinemasPage";
import CinemaDetailPage from "./pages/CinemaDetailPage";
import PromotionsPage from "./pages/PromotionsPage";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminRoute from "./components/auth/AdminRoute";
import NewsDetailPage from "./pages/News/NewsDetailPage";
import PromotionDetailPage from "./pages/Promotions/PromotionDetailPage";
import StaticPage from "./pages/StaticPage";
import SplashScreen from "./components/common/SplashScreen";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const prevPath = useRef(null);

  const hideSplash = useCallback(() => setShowSplash(false), []);

  // Re-trigger splash khi navigate về "/" (kể cả khi đang ở "/")
  useEffect(() => {
    if (prevPath.current !== null && location.pathname === "/") {
      setShowSplash(true);
    }
    prevPath.current = location.pathname;
  }, [location.pathname, location.state?.splashTs]);

  return (
    <>
      {showSplash && <SplashScreen onDone={hideSplash} />}
      <ScrollToTop />
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/cinemas/:id" element={<CinemaDetailPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/promotions/:id" element={<PromotionDetailPage />} />
        <Route path="/news/:id" element={<NewsDetailPage />} />
        <Route path="/about" element={<StaticPage />} />
        <Route path="/careers" element={<StaticPage />} />
        <Route path="/contact" element={<StaticPage />} />
        <Route path="/faq" element={<StaticPage />} />
        <Route path="/help" element={<StaticPage />} />
        <Route path="/terms" element={<StaticPage />} />
        <Route path="/privacy" element={<StaticPage />} />
        <Route path="/cookies" element={<StaticPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Yêu cầu đăng nhập */}
        <Route path="/booking/:id" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
        <Route path="/payment" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
        <Route path="/payment-success" element={<PrivateRoute><PaymentSuccessPage /></PrivateRoute>} />
        <Route path="/my-tickets" element={<PrivateRoute><MyTicketsPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Chỉ dành cho admin */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
      </Routes>
    </>
  );
}

export default App;
