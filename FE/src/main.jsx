import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { WishlistProvider } from "./context/wishlist-context";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
