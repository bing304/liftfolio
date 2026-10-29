// Liftfolio Web-App: offline-fähig. Version eb84b769e8
const C = 'liftfolio-eb84b769e8';
const ASSETS = ['./', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'fonts/manrope-latin-wght-normal.woff2', 'fonts/manrope-latin-ext-wght-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(C).then(c => c.put('./', cp)); return res; }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.match(r).then(m => m || fetch(r)));
});
