const CACHE_NAME = 'segnapunti-cache-v1.0.3';
// Lista degli asset essenziali per il funzionamento offline
const ASSETS_TO_CACHE = [
  '/', // L'indirizzo base (utile per la modalità standalone)
  'index.html',
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
        // Se l'asset è in cache, restituiscilo
        if (response) {
          // Opzionale: aggiorna la cache in background (Stale-While-Revalidate)
          fetch(event.request).then(
            networkResponse => {
              // Non c'è bisogno di aspettare per questo aggiornamento
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          ).catch(() => {}); // Ignora errori di aggiornamento di background
          
          return response;
        }

        // Se non è in cache, prova a recuperarlo dalla rete
        return fetch(event.request).catch(() => {
            // Se fallisce anche il network (offline), si potrebbe restituire una pagina offline (non implementata qui)
            console.log('[Service Worker] Richiesta fallita e non in cache:', event.request.url);
        });
      })
  );
});
