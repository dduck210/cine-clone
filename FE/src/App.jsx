import React, { useEffect, useState, useRef, useCallback, Component } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error("[ErrorBoundary]", err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-gray-500 mb-4">Vui lòng tải lại trang.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all">
              Tải lại
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import HomePage from "./pages/Home/HomePage";
import MovieDetailPage from "./pages/Movie/MovieDetailPage";
import BookingPage from "./pages/Booking/BookingPage";
import PaymentPage from "./pages/Payment/PaymentPage";
import MomoPaymentPage from "./pages/Payment/MomoPaymentPage";
import BankTransferPaymentPage from "./pages/Payment/BankTransferPaymentPage";
import PaymentSuccessPage from "./pages/Payment/PaymentSuccessPage";
import MyTicketsPage from "./pages/Ticket/MyTicketsPage";
import Dashboard from "./pages/Admin/Dashboard";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import VerifyEmailPage from "./pages/Auth/VerifyEmailPage";
import ScanPage from "./pages/ScanPage";
import TicketPage from "./pages/TicketPage";
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
      </Routes>
      </ErrorBoundary>
    </>
  );
}

export default App;
