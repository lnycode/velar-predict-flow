// Velar Service Worker for Push Notifications
const CACHE_NAME = 'velar-cache-v1';

self.addEventListener('install', (event) => {
  console.log('[Velar SW] Installing service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Velar SW] Activating service worker...');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Velar SW] Push notification received:', event);
  
  let data = {
    title: 'Velar Migraine Alert',
    body: 'Weather conditions may trigger a migraine.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'migraine-alert',
    requireInteraction: true,
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.error('[Velar SW] Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'migraine-alert',
    requireInteraction: data.requireInteraction !== false,
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Velar SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({ type: 'NOTIFICATION_CLICKED', data: event.notification.data });
            return;
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow('/forecast');
        }
      })
  );
});
