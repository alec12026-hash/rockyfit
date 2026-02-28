/// <reference lib="webworker" />

const CACHE_NAME = 'rockyfit-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return; // Network only for API

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match('/');
        });
      })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'RockyFit';
  const options = {
    body: data.body || 'Time to train!',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data)
  );
});

// TIMER LOGIC
let activeTimerId = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_TIMER') {
    const { endTime, exerciseName } = event.data;
    
    // Cancel any existing timer first
    if (activeTimerId !== null) {
      clearTimeout(activeTimerId);
      activeTimerId = null;
    }
    
    const delay = endTime - Date.now();
    if (delay > 0) {
      activeTimerId = setTimeout(() => {
        self.registration.showNotification('Rest complete! Time to lift 💪', {
          body: exerciseName ? `${exerciseName}` : 'Time for your next set!',
          icon: '/icon-192.png',
          badge: '/icon-96.png',
          tag: 'rest-timer',
          renotify: true,
        });
        activeTimerId = null;
      }, delay);
    }
  } else if (event.data && event.data.type === 'CANCEL_TIMER') {
    // Cancel the pending timer notification
    if (activeTimerId !== null) {
      clearTimeout(activeTimerId);
      activeTimerId = null;
    }
  }
});
