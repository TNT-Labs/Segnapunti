// ===================================================================
// 💾 STORAGE HELPER - Safari Private Mode Compatible
// ===================================================================

const StorageHelper = (() => {
  let memoryCache = {};
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
    return memoryCache[key] || null;
  };
  
  const setItem = (key, value) => {
    if (checkAvailability()) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('localStorage.setItem failed:', e);
      }
    }
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
