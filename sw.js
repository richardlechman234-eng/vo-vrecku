/* Starý service worker Vo vrecku sa sám zruší a zmaže uložené súbory,
   aby nainštalovaná appka zo starej adresy ukázala stránku o presťahovaní. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url);
  })());
});
