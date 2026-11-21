/* =========================================================
   SERVICE WORKER – pomocník, ktorý beží v pozadí prehliadača.
   Vďaka nemu:
   - sa aplikácia dá nainštalovať na plochu ako appka,
   - funguje aj bez internetu (aj s grafmi).
   Tvoje dáta NEUKLADÁ – tie sú v prehliadači (localStorage).
   ========================================================= */

// Pri zmene súborov stačí zvýšiť číslo verzie
const CACHE = 'vo-vrecku-v1';

const CHART_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
const FILES = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', CHART_URL];

// Pri inštalácii si stiahne všetky súbory do zásoby
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

// Zmaže staré zásoby po aktualizácii
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Chart.js sa nikdy nemení -> najprv zo zásoby (rýchle, funguje offline)
  if (req.url === CHART_URL) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
    return;
  }

  // Súbory aplikácie -> najprv z internetu (aby si mal vždy novú verziu),
  // bez internetu zo zásoby
  if (new URL(req.url).origin === location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then((hit) => hit || caches.match('./')))
    );
  }
});
