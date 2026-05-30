import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosInstance from "@/api/axiosConfig";

const AdminRoute = ({ children }) => {
  const localUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const [status, setStatus] = useState("checking"); // checking | ok | deny

  useEffect(() => {
    // Verify role from server, not just localStorage
    const token = localStorage.getItem("token");
    if (!token || !localUser) { setStatus("deny"); return; }
    if (localUser.role !== "admin") { setStatus("deny"); return; }

    axiosInstance.get("/auth/profile")
      .then(({ data }) => {
        if (data.role === "admin") setStatus("ok");
        else setStatus("deny");
      })
      .catch(() => setStatus("deny"));
  }, []);

  if (status === "checking") return null;
  if (status === "deny") return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
