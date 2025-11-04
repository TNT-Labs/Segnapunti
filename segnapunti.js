const CACHE_NAME = 'segnapunti-cache-v1.0.6'; // 🚩 AGGIORNATO: Versione incrementata
// Lista degli asset essenziali per il funzionamento offline
const ASSETS_TO_CACHE = [
  '/', 
  'index.html',
  'settings.html',
  'storico.html', 
  'segnapunti.js',
  'segnapunti.css',
  'manifest.json',
  'icon-192.png', 
  'icon-512.png',
  // Assumi che tu abbia incluso gli altri asset statici necessari qui
];

// 1. Installazione del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installazione completata. Avvio caching...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Attivazione del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Attivazione in corso...');
  // Rimuove le vecchie cache
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminazione cache obsoleta:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Gestione delle Richieste (Caching)
self.addEventListener('fetch', event => {
  // Strategia: Cache-First, fallendo al network (Stale-While-Revalidate implicito)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Aggiorna la cache in background (opzionale)
          fetch(event.request).then(
            networkResponse => {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          ).catch(() => {}); 
          
          return response;
        }

        return fetch(event.request).catch(() => {
            console.log('[Service Worker] Richiesta fallita e non in cache:', event.request.url);
        });
      })
  );
});
