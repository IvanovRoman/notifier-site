/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCb_u96WSZM8w1PHA1VoVpI7G5cICFmkls",
  authDomain: "notifier-site-8dbc5.firebaseapp.com",
  projectId: "notifier-site-8dbc5",
  storageBucket: "notifier-site-8dbc5.firebasestorage.app",
  messagingSenderId: "82278801196",
  appId: "1:82278801196:web:df511b5c95946a6e669689",
  measurementId: "G-JRC4SX9SDV"
});

const messaging = firebase.messaging();

// Handle data-only messages in background (FCM does NOT auto-display data messages)
messaging.onBackgroundMessage((payload) => {
  console.log("[sw] onBackgroundMessage", payload);
  const title = payload.data?.title || "Уведомление";
  const body = payload.data?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    tag: "notification-" + Date.now(),
  });
});