/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// This runs in the background and handles push notifications when the app is not focused.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCpFe90SDz67pxjaZRI-xadNZLbIERUhNU",
  authDomain: "anoninaija.firebaseapp.com",
  projectId: "anoninaija",
  storageBucket: "anoninaija.firebasestorage.app",
  messagingSenderId: "684024729412",
  appId: "1:684024729412:web:f55949c49c599241695111",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification?.title || "New message on Inkognito 👀";
  const notificationOptions = {
    body: payload.notification?.body || "Someone sent you a message",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: "inkognito-message",
    renotify: true,
    data: {
      click_action: payload.data?.click_action || "/dashboard",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — open dashboard
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.click_action || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // If there's already a tab open, focus it
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
