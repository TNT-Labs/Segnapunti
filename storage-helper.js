// ===================================================================
// 💾 STORAGE HELPER - Safari Private Mode Compatible
// ===================================================================

const StorageHelper = (() => {
  let memoryCache = {};
  let cacheKeys = []; // ✅ FIX BUG #40: LRU queue per memory cache
  const MAX_CACHE_ITEMS = 100; // ✅ FIX BUG #40: Limite per prevenire memory leak
  let isAvailable = null;
  
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
      console.warn('⚠️ localStorage unavailable:', e.name);
      isAvailable = false;
      return false;
    }
  };
  
  const getItem = (key) => {
    if (checkAvailability()) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('localStorage.getItem failed:', e);
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
        console.warn('localStorage.setItem failed:', e);
      }
    }

    // ✅ FIX BUG #40: LRU eviction quando cache piena
    if (memoryCache[key] === undefined && cacheKeys.length >= MAX_CACHE_ITEMS) {
      // Rimuovi il meno recentemente usato (primo elemento)
      const oldest = cacheKeys.shift();
      delete memoryCache[oldest];
      console.log(`[StorageHelper] LRU evicted: ${oldest}`);
    }

    // Aggiorna o aggiungi nuovo elemento
    const existingIndex = cacheKeys.indexOf(key);
    if (existingIndex > -1) {
      // Key già esiste, muovi alla fine
      cacheKeys.splice(existingIndex, 1);
    }
    cacheKeys.push(key);
    memoryCache[key] = value;
  };
  
  const removeItem = (key) => {
    if (checkAvailability()) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('localStorage.removeItem failed:', e);
      }
    }

    // ✅ FIX BUG #40: Rimuovi anche da LRU queue
    const index = cacheKeys.indexOf(key);
    if (index > -1) {
      cacheKeys.splice(index, 1);
    }
    delete memoryCache[key];
  };
  
  const clear = () => {
    if (checkAvailability()) {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('localStorage.clear failed:', e);
      }
    }
    memoryCache = {};
    cacheKeys = []; // ✅ FIX BUG #40: Reset anche LRU queue
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
