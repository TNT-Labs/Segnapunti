# Web Version (PWA)

Questa cartella contiene la versione web/PWA dell'applicazione Segnapunti.

## File Principali

- **index.html** - Pagina principale dell'app web
- **segnapunti.js** - Logica principale dell'applicazione
- **segnapunti.css** / **segnapunti-mobile.css** - Stili per desktop e mobile
- **manifest.json** - Manifest PWA per installazione come app
- **service-worker.js** - Service Worker per funzionalità offline

## Moduli

- **ads-module.js** - Gestione annunci pubblicitari (AdMob/AdSense)
- **dark-mode-toggle.js** - Gestione tema scuro/chiaro
- **storage-helper.js** - Wrapper per localStorage
- **error-handler.js** - Gestione errori centralizzata
- **logger.js** - Sistema di logging
- **statistics-module.js** - Calcolo statistiche partite
- **export-module.js** - Export/import dati
- **polyfills.js** - Polyfills per compatibilità browser

## Pagine HTML

- **settings.html** - Configurazione partita
- **storico.html** - Storico partite
- **statistiche.html** - Statistiche
- **about.html** - Informazioni app
- **preset-manager.html** - Gestione preset personalizzati

## Note

La versione React Native è ora la versione principale dell'app. Questa versione web è mantenuta per compatibilità e per utenti che preferiscono usare l'app da browser.
