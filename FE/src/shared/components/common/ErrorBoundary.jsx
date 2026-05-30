import React, { Component } from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.error("[ErrorBoundary]", err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Vui lòng tải lại trang để tiếp tục.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all active:scale-95"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
