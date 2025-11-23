// ===================================================================
// 🔖 APP VERSION - Single Source of Truth
// ===================================================================
// ✅ FIX BUG #34: Centralizza versione per Service Worker e app
//
// IMPORTANTE: Incrementa questa versione ad ogni deploy/release
// - Service Worker la usa per cache versioning
// - L'app principale può usarla per display e logging
// ===================================================================

const APP_VERSION = '1.3.2';

// Export per uso in Service Worker e altri moduli
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APP_VERSION };
}

// Export globale per browser
if (typeof window !== 'undefined') {
  window.APP_VERSION = APP_VERSION;
}

// Export per Service Worker context
if (typeof self !== 'undefined' && self instanceof ServiceWorkerGlobalScope) {
  self.APP_VERSION = APP_VERSION;
}
