const CACHE_NAME = 'segnapunti-cache-v1.0.5'; // Versione incrementata
// Lista degli asset essenziali per il funzionamento offline
const ASSETS_TO_CACHE = [
  '/', 
  'index.html',
  'settings.html',
  'storico.html', // NUOVO: Inclusione della pagina storico
  'segnapunti.js',
  'segnapunti.css',
  'manifest.json',
  // Aggiungere qui tutti i percorsi delle icone
  'icon-192.png', 
  'icon-512.png',
  'icon-72x72.png',
  'icon-96x96.png',
  'icon-128x128.png',
  'icon-144x144.png',
  'icon-152x152.png',
  'icon-384x384.png'
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
  // Strategia: Cache-First, fallendo al network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Opzionale: aggiorna la cache in background (Stale-While-Revalidate)
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
