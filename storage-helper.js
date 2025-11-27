// ===================================================================
// 💾 STORAGE HELPER - Safari Private Mode Compatible
// ===================================================================

const StorageHelper = (() => {
  let memoryCache = {};
  let cacheKeys = []; // ✅ FIX BUG #40: LRU queue per memory cache
  const MAX_CACHE_ITEMS = 100; // ✅ FIX BUG #40: Limite per prevenire memory leak
  const MAX_CACHE_SIZE_BYTES = 5 * 1024 * 1024; // ✅ FIX AUDIT #4: Limite 5MB totali
  let currentCacheSize = 0; // ✅ FIX AUDIT #4: Traccia dimensione corrente
  let isAvailable = null;

  // ✅ FIX AUDIT #4: Helper per calcolare dimensione stringa in bytes
  const getByteSize = (str) => {
    if (!str) return 0;
    return new Blob([str]).size;
  };
  
  // Test localStorage availability
  const checkAvailability = () => {
    if (isAvailable !== null) return isAvailable;
    
    try {
      if (typeof localStorage === 'undefined') {
        isAvailable = false;
        return false;
      }
      
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      isAvailable = true;
      return true;
    } catch (e) {
      Logger.warn('⚠️ localStorage unavailable:', e.name);
      isAvailable = false;
      return false;
    }
  };
  
  const getItem = (key) => {
    if (checkAvailability()) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        Logger.warn('localStorage.getItem failed:', e);
      }
    }

    // ✅ FIX BUG #40: Update LRU on access
    const value = memoryCache[key];
    if (value !== undefined) {
      // Move to end (most recently used)
      const index = cacheKeys.indexOf(key);
      if (index > -1) {
        cacheKeys.splice(index, 1);
        cacheKeys.push(key);
      }
    }

    return value || null;
  };
  
  const setItem = (key, value) => {
    if (checkAvailability()) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        Logger.warn('localStorage.setItem failed:', e);
      }
    }

    // ✅ FIX AUDIT #4: Calcola dimensione nuovo valore
    const newValueSize = getByteSize(value);

    // ✅ FIX AUDIT #4: Rimuovi vecchio valore dalla dimensione totale se esiste
    if (memoryCache[key] !== undefined) {
      const oldValueSize = getByteSize(memoryCache[key]);
      currentCacheSize -= oldValueSize;
    }

    // ✅ FIX AUDIT #4: Evict elementi finché c'è spazio (per numero E dimensione)
    while (
      (memoryCache[key] === undefined && cacheKeys.length >= MAX_CACHE_ITEMS) ||
      (currentCacheSize + newValueSize > MAX_CACHE_SIZE_BYTES && cacheKeys.length > 0)
    ) {
      // Rimuovi il meno recentemente usato (primo elemento)
      const oldest = cacheKeys.shift();
      if (oldest && memoryCache[oldest] !== undefined) {
        const evictedSize = getByteSize(memoryCache[oldest]);
        currentCacheSize -= evictedSize;
        delete memoryCache[oldest];
        Logger.log(`[StorageHelper] LRU evicted: ${oldest} (freed ${evictedSize} bytes, current: ${currentCacheSize})`);
      }
    }

    // ✅ FIX AUDIT #4: Verifica che il nuovo valore non superi da solo il limite
    if (newValueSize > MAX_CACHE_SIZE_BYTES) {
      Logger.warn(`[StorageHelper] Valore troppo grande per cache (${newValueSize} bytes > ${MAX_CACHE_SIZE_BYTES} limit). Salvato solo in localStorage.`);
      return; // Non aggiungere alla memory cache
    }

    // Aggiorna o aggiungi nuovo elemento
    const existingIndex = cacheKeys.indexOf(key);
    if (existingIndex > -1) {
      // Key già esiste, muovi alla fine
      cacheKeys.splice(existingIndex, 1);
    }
    cacheKeys.push(key);
    memoryCache[key] = value;
    currentCacheSize += newValueSize;
  };
  
  const removeItem = (key) => {
    if (checkAvailability()) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        Logger.warn('localStorage.removeItem failed:', e);
      }
    }

    // ✅ FIX BUG #40 + AUDIT #4: Rimuovi da LRU queue e aggiorna dimensione
    const index = cacheKeys.indexOf(key);
    if (index > -1) {
      cacheKeys.splice(index, 1);
    }
    if (memoryCache[key] !== undefined) {
      const removedSize = getByteSize(memoryCache[key]);
      currentCacheSize -= removedSize;
      delete memoryCache[key];
    }
  };

  const clear = () => {
    if (checkAvailability()) {
      try {
        localStorage.clear();
      } catch (e) {
        Logger.warn('localStorage.clear failed:', e);
      }
    }
    memoryCache = {};
    cacheKeys = []; // ✅ FIX BUG #40: Reset anche LRU queue
    currentCacheSize = 0; // ✅ FIX AUDIT #4: Reset dimensione cache
  };
  
  return {
    getItem,
    setItem,
    removeItem,
    clear,
    isAvailable: checkAvailability
  };
})();

window.StorageHelper = StorageHelper;
