// ===================================================================
// ✅ FIX #25: SERVICE WORKER STRATEGY - Cache con versioning
// ===================================================================
// Strategia:
// - Static Assets (HTML/CSS/JS): Cache First + Stale-While-Revalidate
// - Immagini: Cache First con max age 30 giorni
// - Network: Network fallback se cache non disponibile
// - Update: skipWaiting() per update immediati
// ===================================================================

// ✅ FIX BUG #34: Import versione da file centralizzato
importScripts('version.js');
// ✅ FIX BUG #41: Import logger per production-safe logging
importScripts('logger.js');

// ✅ FIX BUG #50: Allineato fallback versione con version.js
const CACHE_VERSION = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1.3.5';
const CACHE_NAME = `segnapunti-cache-v${CACHE_VERSION}`;
const MAX_CACHE_AGE_DAYS = 30; // Expiration cache immagini

Logger.log(`[Service Worker] Version: ${CACHE_VERSION}`);

// ✅ Lista completa asset (VERIFICATA + storage-helper.js)
const ASSETS_TO_CACHE = [
  './',  // ✅ FIX: Aggiungi './' oltre a '/'
  '/',
  'index.html',
  'settings.html',
  'storico.html',
  'preset-manager.html',
  'storage-helper.js', // ✅ FIX #2: Safari storage helper
  'version.js', // ✅ FIX BUG #34: Versione centralizzata
  'logger.js', // ✅ FIX BUG #41: Production-safe logging
  'error-handler.js', // ✅ FIX BUG #46: Global error boundary
  'polyfills.js', // ✅ FIX BUG #43: Browser compatibility
  'segnapunti.js',
  'segnapunti.css',
  'segnapunti-mobile.css', // ✅ MOBILE OPTIMIZATION
  'utility-classes.css', // ✅ FIX BUG #45: Reusable CSS classes
  'preset-manager.js',
  'preset-manager.css',
  'ads-module.js', // ✅ MONETIZATION: Banner & Interstitial ads
  'export-module.js', // ✅ EXPORT FEATURE: PDF & CSV export
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
  Logger.log('[Service Worker] Installazione v1.3.0 completata. Avvio caching...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        Logger.log('[Service Worker] Caching assets...');
        return cache.addAll(ASSETS_TO_CACHE)
          .catch(error => {
            Logger.error('[Service Worker] Errore caching assets:', error);
            // Continua comunque anche se alcuni asset falliscono
            return Promise.all(
              ASSETS_TO_CACHE.map(asset => {
                return cache.add(asset).catch(err => {
                  Logger.warn(`[Service Worker] Impossibile cachare: ${asset}`, err);
                });
              })
            );
          });
      })
      .then(() => {
        Logger.log('[Service Worker] Cache completata');
        return self.skipWaiting();
      })
  );
});

// 2. Attivazione del Service Worker
self.addEventListener('activate', event => {
  Logger.log('[Service Worker] Attivazione v1.3.0 in corso...');
  // Rimuove le vecchie cache
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            Logger.log('[Service Worker] Eliminazione cache obsoleta:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      Logger.log('[Service Worker] Attivazione completata');
      return self.clients.claim();
    })
  );
});

// ✅ FIX #25: Helper per verificare età cache
const isCacheExpired = (cachedResponse) => {
  if (!cachedResponse || !cachedResponse.headers) return true;

  const dateHeader = cachedResponse.headers.get('date');
  if (!dateHeader) return true; // Nessuna data, considera expired

  const cachedTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const ageInDays = (now - cachedTime) / (1000 * 60 * 60 * 24);

  return ageInDays > MAX_CACHE_AGE_DAYS;
};

// ✅ FIX #25: Determina se richiesta è per immagine
const isImageRequest = (request) => {
  return request.url.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i);
};

// 3. Gestione delle Richieste (Caching)
self.addEventListener('fetch', event => {
  // Skip per richieste non-GET o chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // ✅ FIX #25: Strategia Cache-First con expiration per immagini
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // ✅ FIX #25: Check expiration per immagini
        if (cachedResponse && isImageRequest(event.request)) {
          if (isCacheExpired(cachedResponse)) {
            Logger.log('[SW] Cache expired per:', event.request.url);
            // Cache expired, forza network fetch
            cachedResponse = null;
          }
        }

        if (cachedResponse) {
          // ✅ Trovato in cache e non expired, restituiscilo immediatamente

          // ✅ Aggiorna la cache in background (Stale-While-Revalidate) solo per HTML/CSS/JS
          if (!isImageRequest(event.request)) {
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
          }

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
            Logger.log('[Service Worker] Richiesta fallita e non in cache:', event.request.url);

            // ✅ FIX BUG #32: Null check su headers per prevenire crash
            // Fallback per HTML: restituisci index.html dalla cache
            const acceptHeader = event.request.headers?.get('accept');
            if (acceptHeader?.includes('text/html')) {
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
