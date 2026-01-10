// ===================================================================
// 🌙 DARK MODE TOGGLE - Standalone Global Function
// ===================================================================
// ✅ FIX BUG AUDIT #1: Funzione globale per dark mode sempre disponibile
// Questo file viene caricato prima di tutti gli altri per garantire
// che toggleDarkMode() sia sempre disponibile negli onclick inline

(function() {
  'use strict';

  // ===================================================================
  // 🌓 TOGGLE DARK MODE
  // ===================================================================

  window.toggleDarkMode = function() {
    try {
      // Toggle dark mode class
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');

      // Save preference in localStorage (with Safari private mode protection)
      try {
        localStorage.setItem('darkMode', isDark ? 'true' : 'false');
      } catch (storageError) {
        // Safari private mode: localStorage non disponibile
        // Non critico, la preferenza sarà persa al reload
        console.warn('[DarkMode] localStorage non disponibile:', storageError.name);
      }

      // Update toggle button icon
      const iconBtn = document.getElementById('toggle-dark-mode');
      if (iconBtn) {
        iconBtn.textContent = isDark ? '☀️' : '🌙';
        iconBtn.setAttribute('title', isDark ? 'Modalità Chiara' : 'Modalità Scura');
        iconBtn.setAttribute('aria-label', isDark ? 'Attiva modalità chiara' : 'Attiva modalità scura');
      }

      // Dispatch event for modules that need to react to theme change
      try {
        const event = new CustomEvent('darkModeChanged', {
          detail: { isDark: isDark }
        });
        document.dispatchEvent(event);
      } catch (eventError) {
        // Non critico
        console.warn('[DarkMode] Impossibile dispatch event:', eventError);
      }

      // Log (solo se Logger disponibile)
      if (typeof Logger !== 'undefined' && Logger.log) {
        Logger.log('[DarkMode] Modalità cambiata:', isDark ? 'Scura' : 'Chiara');
      }

    } catch (error) {
      console.error('[DarkMode] Errore toggle dark mode:', error);

      // Fallback alert in caso di errore critico
      if (typeof alert === 'function') {
        alert('Errore durante il cambio di tema. Ricarica la pagina.');
      }
    }
  };

  // ===================================================================
  // 🔄 INITIALIZE DARK MODE ON PAGE LOAD
  // ===================================================================

  function initDarkMode() {
    try {
      // Check saved preference
      let isDark = false;

      try {
        const savedMode = localStorage.getItem('darkMode');
        isDark = savedMode === 'true';
      } catch (storageError) {
        // Safari private mode: check if user prefers dark mode via CSS
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          isDark = true;
        }
      }

      // Apply dark mode if needed
      if (isDark) {
        document.body.classList.add('dark-mode');

        // Update button icon
        const iconBtn = document.getElementById('toggle-dark-mode');
        if (iconBtn) {
          iconBtn.textContent = '☀️';
          iconBtn.setAttribute('title', 'Modalità Chiara');
          iconBtn.setAttribute('aria-label', 'Attiva modalità chiara');
        }
      }

      // Log (solo se Logger disponibile)
      if (typeof Logger !== 'undefined' && Logger.log) {
        Logger.log('[DarkMode] Inizializzato:', isDark ? 'Scura' : 'Chiara');
      }

    } catch (error) {
      console.error('[DarkMode] Errore inizializzazione:', error);
    }
  }

  // ===================================================================
  // 🎯 AUTO-INIT
  // ===================================================================

  // Initialize immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
  } else {
    // DOM already loaded
    initDarkMode();
  }

  // ===================================================================
  // 🎨 SYSTEM THEME CHANGE DETECTION
  // ===================================================================

  // Listen for system theme changes (optional enhancement)
  if (window.matchMedia) {
    try {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      // Modern browsers
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', function(e) {
          // Only auto-switch if user hasn't set a manual preference
          try {
            const savedMode = localStorage.getItem('darkMode');
            if (savedMode === null) {
              // No manual preference, follow system
              if (e.matches) {
                document.body.classList.add('dark-mode');
              } else {
                document.body.classList.remove('dark-mode');
              }

              const iconBtn = document.getElementById('toggle-dark-mode');
              if (iconBtn) {
                iconBtn.textContent = e.matches ? '☀️' : '🌙';
              }
            }
          } catch (error) {
            // Safari private mode - ignore
          }
        });
      }
      // Legacy browsers
      else if (darkModeMediaQuery.addListener) {
        darkModeMediaQuery.addListener(function(e) {
          try {
            const savedMode = localStorage.getItem('darkMode');
            if (savedMode === null) {
              if (e.matches) {
                document.body.classList.add('dark-mode');
              } else {
                document.body.classList.remove('dark-mode');
              }

              const iconBtn = document.getElementById('toggle-dark-mode');
              if (iconBtn) {
                iconBtn.textContent = e.matches ? '☀️' : '🌙';
              }
            }
          } catch (error) {
            // Safari private mode - ignore
          }
        });
      }
    } catch (error) {
      // Non critico - ignore
      console.warn('[DarkMode] Impossibile ascoltare cambio tema sistema:', error);
    }
  }

  // ✅ FIX AUDIT #6: Usa Logger invece di console.log per rispettare production mode
  if (typeof Logger !== 'undefined' && Logger.log) {
    Logger.log('✅ Dark Mode Toggle caricato');
  } else {
    console.log('✅ Dark Mode Toggle caricato');
  }
})();
