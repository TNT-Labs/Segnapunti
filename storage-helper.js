// ===================================================================
// 💾 STORAGE HELPER - Safari Private Mode Compatible (v1.0.0)
// ===================================================================
// Risolve il crash di Safari in modalità privata quando accede a localStorage
// Fornisce fallback automatico a memoria quando localStorage non è disponibile

const StorageHelper = (() => {
  let memoryCache = {};
  let isAvailable = null;
  
  /**
   * Verifica se localStorage è disponibile
   * @returns {boolean} True se localStorage funziona
   */
  const checkAvailability = () => {
    // Cache del risultato per performance
    if (isAvailable !== null) return isAvailable;
    
    try {
      // Verifica esistenza localStorage
      if (typeof localStorage === 'undefined') {
        console.warn('⚠️ localStorage non definito');
        isAvailable = false;
        return false;
      }
      
      // Test di scrittura/lettura per verificare disponibilità effettiva
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      isAvailable = true;
      console.log('✅ localStorage disponibile');
      return true;
      
    } catch (e) {
      // SecurityError in Safari private mode
      // QuotaExceededError se storage pieno
      console.warn('⚠️ localStorage non disponibile:', e.name);
      isAvailable = false;
      return false;
    }
  };
  
  /**
   * Ottiene un valore dallo storage
   * @param {string} key - Chiave da leggere
   * @returns {string|null} Valore o null se non esiste
   */
  const getItem = (key) => {
    if (checkAvailability()) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn(`⚠️ Errore lettura localStorage[${key}]:`, e);
      }
    }
    
    // Fallback memoria
    return memoryCache[key] || null;
  };
  
  /**
   * Salva un valore nello storage
   * @param {string} key - Chiave
   * @param {string} value - Valore da salvare
   */
  const setItem = (key, value) => {
    if (checkAvailability()) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn(`⚠️ Errore scrittura localStorage[${key}]:`, e);
      }
    }
    
    // Salva sempre in memoria come backup
    memoryCache[key] = value;
  };
  
  /**
   * Rimuove un valore dallo storage
   * @param {string} key - Chiave da rimuovere
   */
  const removeItem = (key) => {
    if (checkAvailability()) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`⚠️ Errore rimozione localStorage[${key}]:`, e);
      }
    }
    
    // Rimuovi da memoria
    delete memoryCache[key];
  };
  
  /**
   * Pulisce tutto lo storage
   */
  const clear = () => {
    if (checkAvailability()) {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('⚠️ Errore clear localStorage:', e);
      }
    }
    
    // Pulisci memoria
    memoryCache = {};
  };
  
  /**
   * Ottiene tutte le chiavi disponibili
   * @returns {string[]} Array di chiavi
   */
  const keys = () => {
    const allKeys = new Set(Object.keys(memoryCache));
    
    if (checkAvailability()) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          allKeys.add(localStorage.key(i));
        }
      } catch (e) {
        console.warn('⚠️ Errore lettura chiavi localStorage:', e);
      }
    }
    
    return Array.from(allKeys);
  };
  
  /**
   * Ottiene la dimensione stimata dei dati in storage
   * @returns {number} Dimensione in byte (approssimativa)
   */
  const estimatedSize = () => {
    let size = 0;
    
    // Conta memoria
    Object.entries(memoryCache).forEach(([key, value]) => {
      size += key.length + (value ? value.length : 0);
    });
    
    // Conta localStorage se disponibile
    if (checkAvailability()) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          size += key.length + (value ? value.length : 0);
        }
      } catch (e) {
        console.warn('⚠️ Errore calcolo dimensione:', e);
      }
    }
    
    return size;
  };
  
  /**
   * Mostra banner informativo se storage non disponibile
   */
  const showWarningIfUnavailable = () => {
    if (!checkAvailability() && !sessionStorage.getItem('storage_warning_shown')) {
      // Mostra solo una volta per sessione
      sessionStorage.setItem('storage_warning_shown', 'true');
      
      const banner = document.createElement('div');
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff9800;
        color: white;
        padding: 12px 20px;
        text-align: center;
        z-index: 10003;
        font-size: 0.9em;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      `;
      banner.innerHTML = `
        <strong>⚠️ Modalità Privata Rilevata</strong><br>
        <small>I dati saranno salvati temporaneamente in memoria e andranno persi alla chiusura.</small>
      `;
      
      document.body.appendChild(banner);
      
      // Auto-remove dopo 5 secondi
      setTimeout(() => {
        banner.style.transition = 'opacity 0.5s';
        banner.style.opacity = '0';
        setTimeout(() => banner.remove(), 500);
      }, 5000);
    }
  };
  
  // API pubblica
  return {
    getItem,
    setItem,
    removeItem,
    clear,
    keys,
    estimatedSize,
    isAvailable: checkAvailability,
    showWarningIfUnavailable
  };
})();

// Esporta globalmente
if (typeof window !== 'undefined') {
  window.StorageHelper = StorageHelper;
}

// Esporta per moduli ES6 (se necessario)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageHelper;
}

// Log iniziale
console.log('[StorageHelper] Inizializzato - localStorage:', 
  StorageHelper.isAvailable() ? '✅ Disponibile' : '⚠️ Non disponibile (usando memoria)'
);
