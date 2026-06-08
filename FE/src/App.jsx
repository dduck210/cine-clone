import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/shared/components/common/ErrorBoundary";
import SplashScreen from "@/shared/components/common/SplashScreen";
import NotFoundPage from "@/shared/components/common/NotFoundPage";

import HomePage from "@/features/home/pages/HomePage";
import MovieDetailPage from "@/features/movies/pages/MovieDetailPage";
import MoviesPage from "@/features/movies/pages/MoviesPage";
import BookingPage from "@/features/booking/pages/BookingPage";
import PaymentPage from "@/features/payment/pages/PaymentPage";
import MomoPaymentPage from "@/features/payment/pages/MomoPaymentPage";
import BankTransferPaymentPage from "@/features/payment/pages/BankTransferPaymentPage";
import PaymentSuccessPage from "@/features/payment/pages/PaymentSuccessPage";
import MyTicketsPage from "@/features/tickets/pages/MyTicketsPage";
import TicketPage from "@/features/tickets/pages/TicketPage";
import Dashboard from "@/features/admin/pages/Dashboard";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import ScanPage from "@/features/scan/pages/ScanPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import CinemasPage from "@/features/cinemas/pages/CinemasPage";
import CinemaDetailPage from "@/features/cinemas/pages/CinemaDetailPage";
import PromotionsPage from "@/features/promotions/pages/PromotionsPage";
import PromotionDetailPage from "@/features/promotions/pages/PromotionDetailPage";
import NewsDetailPage from "@/features/news/pages/NewsDetailPage";
import StaticPage from "@/features/static/pages/StaticPage";
import PrivateRoute from "@/features/auth/components/PrivateRoute";
import AdminRoute from "@/features/auth/components/AdminRoute";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();
  // Splash only on first visit to "/"
  const [showSplash, setShowSplash] = useState(location.pathname === "/");

  const hideSplash = useCallback(() => { window.scrollTo(0, 0); setShowSplash(false); }, []);

  return (
    <>
      {showSplash && <SplashScreen onDone={hideSplash} />}
      <ScrollToTop />
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} containerStyle={{ zIndex: 100000, top: '88px' }} />
      <ErrorBoundary>
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/ticket/:bookingCode" element={<TicketPage />} />

        {/* Yêu cầu đăng nhập */}
        <Route path="/booking/:id" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
        <Route path="/payment" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
        <Route path="/payment/momo" element={<PrivateRoute><MomoPaymentPage /></PrivateRoute>} />
        <Route path="/payment/bank" element={<PrivateRoute><BankTransferPaymentPage /></PrivateRoute>} />
        <Route path="/payment-success" element={<PrivateRoute><PaymentSuccessPage /></PrivateRoute>} />
        <Route path="/ticket-detail" element={<PrivateRoute><PaymentSuccessPage /></PrivateRoute>} />
        <Route path="/my-tickets" element={<PrivateRoute><MyTicketsPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Chỉ dành cho admin */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ErrorBoundary>
    </>
  );
}

export default App;
