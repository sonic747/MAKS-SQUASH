// Firebase Cloud Messaging Service Worker for MAKS Squash Club
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  let notificationData = {
    title: '⚡ [MAKS SQUASH] 클럽 새 공지가 도착했습니다',
    body: '클럽 공지사항을 확인해 보세요!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'maks-club-notice',
    data: {
      url: '/',
      timestamp: Date.now(),
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        notificationData.title = payload.notification.title || notificationData.title;
        notificationData.body = payload.notification.body || notificationData.body;
      }
      if (payload.data) {
        notificationData.data = { ...notificationData.data, ...payload.data };
        if (payload.data.title) notificationData.title = payload.data.title;
        if (payload.data.body) notificationData.body = payload.data.body;
      }
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const notificationPromise = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
  });

  event.waitUntil(notificationPromise);
});

// Click action on the notification banner: Open website or bring tab to front
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            payload: event.notification.data,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
