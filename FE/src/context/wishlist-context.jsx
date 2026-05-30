import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosConfig";

const WishlistContext = createContext({ ids: new Set(), toggle: () => {}, loading: false });

export const WishlistProvider = ({ children }) => {
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load wishlist IDs when user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axiosInstance.get("/auth/wishlist")
      .then((res) => setIds(new Set(res.data.map((m) => m._id))))
      .catch(() => {});
  }, []);

  const toggle = useCallback(async (movieId) => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    // Optimistic update
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(movieId)) next.delete(movieId); else next.add(movieId);
      return next;
    });

    try {
      const res = await axiosInstance.post(`/auth/wishlist/${movieId}`);
      setIds(new Set(res.data.wishlist.map((id) => id.toString())));
      return res.data.saved;
    } catch {
      // Revert on error
      setIds((prev) => {
        const next = new Set(prev);
        if (next.has(movieId)) next.delete(movieId); else next.add(movieId);
        return next;
      });
      return null;
    }
  }, []);

  return (
    <WishlistContext.Provider value={{ ids, toggle, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
