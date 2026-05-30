import axiosInstance from "../axiosConfig";

export const login = (email, password) =>
  axiosInstance.post("/auth/login", { email, password }).then((r) => r.data);

export const register = (name, email, password) =>
  axiosInstance.post("/auth/register", { name, email, password }).then((r) => r.data);

export const forgotPassword = (email) =>
  axiosInstance.post("/auth/forgot-password", { email }).then((r) => r.data);

export const resetPassword = (email, otp, newPassword) =>
  axiosInstance.post("/auth/reset-password", { email, otp, newPassword }).then((r) => r.data);

export const verifyEmail = (email, otp) =>
  axiosInstance.post("/auth/verify-email", { email, otp }).then((r) => r.data);

export const resendVerifyOtp = (email) =>
  axiosInstance.post("/auth/resend-verify-otp", { email }).then((r) => r.data);

export const getProfile = () =>
  axiosInstance.get("/auth/profile").then((r) => r.data);
