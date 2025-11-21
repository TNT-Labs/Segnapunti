// ✅ Cache aggiornata con monetization files + VERSIONE INCREMENTATA
const CACHE_NAME = 'segnapunti-cache-v1.2.3';  // ⚠️ Incrementa ad ogni deploy!

// ✅ Lista completa asset (VERIFICATA)
const ASSETS_TO_CACHE = [
  './',  // ✅ FIX: Aggiungi './' oltre a '/'
  '/', 
  'index.html',
  'settings.html',
  'storico.html',
  'preset-manager.html',
  'premium.html', // ✅ NUOVO
  'segnapunti.js',
  'segnapunti.css',
  'preset-manager.js',
  'preset-manager.css',
  'billing-module.js', // ✅ NUOVO
  'ads-module.js', // ✅ NUOVO
  'premium-ui.js', // ✅ NUOVO
  'manifest.json',
  'icon-192.png', 
  'icon-512.png',
  // Icone complete
  'Segnapunti72x72.png',
  'Segnapunti96x96.png',
  'Segnapunti128x128.png',
  'Segnapunti144x144.png',
  'Segnapunti152x152.png',
  'Segnapunti192x192.png',
  'Segnapunti384x384.png',
  'Segnapunti512x512.png',
  'Segnapunti1024x1024.png'
];

// 1. Installazione del Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installazione v1.2.3 completata. Avvio caching...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching assets...');
        return cache.addAll(ASSETS_TO_CACHE)
          .catch(error => {
            console.error('[Service Worker] Errore caching assets:', error);
            // Continua comunque anche se alcuni asset falliscono
            return Promise.all(
              ASSETS_TO_CACHE.map(asset => {
                return cache.add(asset).catch(err => {
                  console.warn(`[Service Worker] Impossibile cachare: ${asset}`, err);
                });
              })
            );
          });
      })
      .then(() => {
        console.log('[Service Worker] Cache completata');
        return self.skipWaiting();
      })
  );
});

// 2. Attivazione del Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Attivazione v1.1.2 in corso...');
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
    }).then(() => {
      console.log('[Service Worker] Attivazione completata');
      return self.clients.claim();
    })
  );
});

// 3. Gestione delle Richieste (Caching)
self.addEventListener('fetch', event => {
  // Skip per richieste non-GET o chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Strategia: Cache-First con Network Fallback e Update
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // ✅ Trovato in cache, restituiscilo immediatamente
          
          // ✅ Aggiorna la cache in background (Stale-While-Revalidate)
          fetch(event.request).then(
            networkResponse => {
              // Solo se la risposta è OK
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
            }
          ).catch(() => {
            // Network error, ma abbiamo già la cache
          }); 
          
          return cachedResponse;
        }

        // ✅ Non in cache, prova il network
        return fetch(event.request)
          .then(networkResponse => {
            // Se la risposta è valida, cachala
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] Richiesta fallita e non in cache:', event.request.url);
            
            // ✅ Fallback per HTML: restituisci index.html dalla cache
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('index.html');
            }
            
            throw error;
          });
      })
  );
});

// ✅ Gestione messaggi per forzare update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
