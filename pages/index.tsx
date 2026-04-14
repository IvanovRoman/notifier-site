import { useState, useEffect } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "../lib/firebase-client";
import styles from "../styles/Home.module.css";

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export default function Home() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
    fetchNotifications();

    // Auto-refresh notifications every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);

    // Refresh when page regains focus
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!isSupported) return;

    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[fg] onMessage", payload);
      const title = payload.data?.title || "Уведомление";
      const body = payload.data?.body || "";

      // Show notification via Notification API in foreground
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon-192.png", tag: "notif-" + Date.now() });
      }

      // Refresh notifications list
      fetchNotifications();
    });

    return () => unsubscribe();
  }, [isSupported]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      console.error("Failed to fetch notifications");
    }
  };

  const subscribe = async () => {
    if (!isSupported) return;

    setLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        alert("Разрешение на уведомления отклонено");
        return;
      }

      const messaging = getMessaging(app);
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        alert("VAPID key not configured. Check .env.local");
        return;
      }

      const token = await getToken(messaging, { vapidKey });

      // Register service worker
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      // Send token to server
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "subscribe" }),
      });

      alert("Вы подписаны на уведомления! ✅");
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Ошибка при подписке. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const messaging = getMessaging(app);
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      const token = await getToken(messaging, { vapidKey });

      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "unsubscribe" }),
      });

      setPermission("default");
      alert("Вы отписаны от уведомлений ❌");
    } catch (error) {
      console.error("Unsubscribe error:", error);
      alert("Ошибка при отписке.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>🔔 Уведомления</h1>
        <p className={styles.description}>
          Подпишитесь, чтобы получать push-уведомления в браузере
        </p>

        {!isSupported ? (
          <div className={styles.warning}>
            ⚠️ Ваш браузер не поддерживает push-уведомления
          </div>
        ) : permission !== "granted" ? (
          <button
            className={styles.subscribeButton}
            onClick={subscribe}
            disabled={loading}
          >
            {loading ? "⏳ Подписка..." : "🔔 Подписаться на уведомления"}
          </button>
        ) : (
          <div className={styles.subscribed}>
            <span className={styles.badge}>✅ Вы подписаны</span>
            <button
              className={styles.unsubscribeButton}
              onClick={unsubscribe}
              disabled={loading}
            >
              {loading ? "⏳..." : "Отписаться"}
            </button>
          </div>
        )}

        <section className={styles.history}>
          <h2 className={styles.historyTitle}>📋 История уведомлений</h2>
          {notifications.length === 0 ? (
            <p className={styles.empty}>Уведомлений пока нет</p>
          ) : (
            <ul className={styles.notificationList}>
              {notifications.map((n) => (
                <li key={n.id} className={styles.notificationItem}>
                  <div className={styles.notificationHeader}>
                    <strong>{n.title}</strong>
                    <span className={styles.notificationDate}>
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className={styles.notificationBody}>{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <p>Push-уведомления через Firebase · Хостинг на Vercel</p>
      </footer>
    </div>
  );
}