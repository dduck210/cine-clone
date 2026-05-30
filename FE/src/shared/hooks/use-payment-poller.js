import { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../../api/axiosConfig";

export default function usePaymentPoller({
  orderId,
  pollInterval = 5000,
  timeoutSeconds = 900,
  onSuccess,
  onExpire,
}) {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopPolling();
          setIsExpired(true);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Payment status poll
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await axiosInstance.get(`/payments/status/${orderId}`);
        if (data.status === "paid" || data.status === "success") {
          stopPolling();
          setPaymentStatus("paid");
          onSuccess?.();
        }
      } catch {
        // Ignore poll errors silently
      }
    }, pollInterval);

    return stopPolling;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const formattedCountdown = (() => {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  })();

  return { paymentStatus, countdown, formattedCountdown, isExpired, stopPolling };
}
