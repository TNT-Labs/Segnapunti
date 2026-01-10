// ===================================================================
// 🛡️ ERROR HANDLER - Global Error Boundary
// ===================================================================
// ✅ FIX BUG #46: Error boundary globale per errori catastrofici

const GlobalErrorHandler = (() => {
  let errorCount = 0;
  const MAX_ERRORS_BEFORE_FALLBACK = 3;
  let hasShownFallbackUI = false;

  // Mostra UI di fallback quando l'app è in uno stato irrecuperabile
  const showFallbackUI = (errorMessage) => {
    if (hasShownFallbackUI) return; // Evita loop infiniti
    hasShownFallbackUI = true;

    // Crea overlay di errore
    const fallbackDiv = document.createElement('div');
    fallbackDiv.id = 'global-error-fallback';
    fallbackDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    fallbackDiv.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      ">
        <div style="font-size: 4em; margin-bottom: 20px;">⚠️</div>
        <h2 style="margin: 0 0 15px 0; color: #333; font-size: 1.8em;">
          Si è verificato un errore
        </h2>
        <p style="color: #666; margin: 0 0 25px 0; line-height: 1.6;">
          L'applicazione ha riscontrato un problema imprevisto.
          Ti consigliamo di ricaricare la pagina per continuare.
        </p>
        ${errorMessage ? `
          <details style="
            text-align: left;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            font-size: 0.9em;
            color: #666;
          ">
            <summary style="cursor: pointer; font-weight: 600; color: #333;">
              Dettagli tecnici
            </summary>
            <pre style="
              margin-top: 10px;
              white-space: pre-wrap;
              word-wrap: break-word;
            ">${errorMessage}</pre>
          </details>
        ` : ''}
        <button onclick="window.location.reload()" style="
          background: #4A148C;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 1.1em;
          font-weight: 700;
          cursor: pointer;
          margin-right: 10px;
          box-shadow: 0 4px 12px rgba(74, 20, 140, 0.3);
        ">
          🔄 Ricarica la pagina
        </button>
        <button onclick="document.getElementById('global-error-fallback').remove(); window.hasShownFallbackUI = false;" style="
          background: transparent;
          color: #666;
          border: 2px solid #ddd;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
        ">
          Chiudi
        </button>
      </div>
    `;

    document.body.appendChild(fallbackDiv);
  };

  // Handler per errori JavaScript non catturati
  const handleError = (event) => {
    errorCount++;

    const errorInfo = {
      message: event.error?.message || event.message || 'Unknown error',
      filename: event.filename || event.error?.fileName || 'unknown',
      lineno: event.lineno || event.error?.lineNumber || 0,
      colno: event.colno || event.error?.columnNumber || 0,
      stack: event.error?.stack || ''
    };

    Logger.error('🔴 Uncaught error:', errorInfo);

    // Mostra fallback UI dopo troppi errori
    if (errorCount >= MAX_ERRORS_BEFORE_FALLBACK) {
      showFallbackUI(`${errorInfo.message}\n\nFile: ${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}`);
    }

    // Previeni comportamento default solo se mostreremo il fallback
    if (errorCount >= MAX_ERRORS_BEFORE_FALLBACK) {
      event.preventDefault();
    }
  };

  // Handler per promise rejections non gestite
  const handleUnhandledRejection = (event) => {
    errorCount++;

    const reason = event.reason;
    const errorMessage = reason?.message || reason?.toString() || 'Unknown rejection';

    Logger.error('🔴 Unhandled promise rejection:', reason);

    // Mostra fallback UI dopo troppi errori
    if (errorCount >= MAX_ERRORS_BEFORE_FALLBACK) {
      showFallbackUI(`Promise rejection: ${errorMessage}`);
      event.preventDefault();
    }
  };

  // Handler per errori nei Service Worker
  const handleServiceWorkerError = (event) => {
    Logger.warn('⚠️  Service Worker error:', event);
    // Non conta verso il limite perché Service Worker errors sono spesso non-critici
  };

  // Inizializzazione
  const init = () => {
    if (typeof window === 'undefined') return; // Solo browser

    // Attach global error handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Service Worker errors
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('error', handleServiceWorkerError);
    }

    // Reset error count periodicamente (ogni 5 minuti)
    // per evitare che errori vecchi causino fallback inutili
    setInterval(() => {
      if (errorCount > 0) {
        errorCount = Math.max(0, errorCount - 1);
      }
    }, 300000); // 5 minuti

    Logger.log('✅ Global error handler initialized');
  };

  // API pubblica
  return {
    init,
    showFallbackUI, // Esposto per test o chiamate manuali
    getErrorCount: () => errorCount
  };
})();

// Auto-initialize quando il DOM è pronto
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      GlobalErrorHandler.init();
    });
  } else {
    GlobalErrorHandler.init();
  }

  // Export globale
  window.GlobalErrorHandler = GlobalErrorHandler;
}

// Export per moduli
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlobalErrorHandler;
}
