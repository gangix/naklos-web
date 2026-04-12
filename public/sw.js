// Minimal service worker — required for PWA installability.
// Does not cache anything; the app always fetches from the network.
// Add caching strategies here later if offline support is needed.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));