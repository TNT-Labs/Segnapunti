// ===================================================================
// 📋 LOGGER MODULE - Production-Safe Logging
// ===================================================================
// ✅ FIX BUG #41: Wrapper per console.log che disabilita logging in production

const Logger = (() => {
  // Rileva ambiente (development vs production)
  const isDevelopment = () => {
    if (typeof window === 'undefined') return true; // Service Worker

    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    );
  };

  const isDebugMode = () => {
    try {
      return localStorage.getItem('debug_mode') === 'true';
    } catch (e) {
      return false;
    }
  };

  const shouldLog = isDevelopment() || isDebugMode();

  // Metodi di logging
  const log = (...args) => {
    if (shouldLog) {
      console.log(...args);
    }
  };

  const warn = (...args) => {
    // Warnings sempre visibili
    console.warn(...args);
  };

  const error = (...args) => {
    // Errors sempre visibili
    console.error(...args);
  };

  const info = (...args) => {
    if (shouldLog) {
      console.info(...args);
    }
  };

  const debug = (...args) => {
    if (isDebugMode()) {
      console.debug(...args);
    }
  };

  // In production, cattura errori globali
  if (!isDevelopment()) {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        // Qui potresti inviare errori a un servizio di monitoraggio
        console.error('Uncaught error:', event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
      });
    }
  }

  return {
    log,
    warn,
    error,
    info,
    debug,
    isDevelopment: isDevelopment(),
    isDebugMode: isDebugMode()
  };
})();

// Export per uso in Service Worker e altri moduli
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}

// Export globale per browser
if (typeof window !== 'undefined') {
  window.Logger = Logger;
}

// Export per Service Worker context
if (typeof self !== 'undefined' && typeof ServiceWorkerGlobalScope !== 'undefined' && self instanceof ServiceWorkerGlobalScope) {
  self.Logger = Logger;
}
