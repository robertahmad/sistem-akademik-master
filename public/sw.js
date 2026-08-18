self.addEventListener('install', event => {
  console.log('PresenAl-Q Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('PresenAl-Q Service Worker activating.');
});

self.addEventListener('fetch', event => {
  // Passthrough fetch requests normally
  event.respondWith(fetch(event.request));
});
