import { useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription(bookingCode) {
  useEffect(() => {
    if (!bookingCode) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;

    async function subscribe() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted" || cancelled) return;

        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        const { data } = await axiosInstance.get("/push/vapid-key");
        if (cancelled) return;

        const existing = await reg.pushManager.getSubscription();
        const sub =
          existing ||
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey),
          }));

        if (cancelled) return;

        await axiosInstance.post("/push/subscribe", {
          subscription: sub.toJSON(),
          bookingCode,
        });
      } catch (err) {
        console.warn("[push] subscription error:", err.message);
      }
    }

    subscribe();
    return () => { cancelled = true; };
  }, [bookingCode]);
}
