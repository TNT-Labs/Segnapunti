// ===================================================================
// 💳 BILLING MODULE - Google Play In-App Purchases (✅ FIXED v1.3.0)
// ===================================================================

const BillingModule = (() => {
  const PREMIUM_SKU = 'premium_no_ads'; // ID prodotto in Google Play Console
  const BILLING_STORAGE_KEY = 'premium_status';
  
  let isPremiumUser = false;
  let billingClient = null;
  let purchaseUpdateListener = null;
  
  // ✅ FIX #2: In-memory fallback storage
  let memoryStorage = {
    premium_status: null
  };

  // ===================================================================
  // 🔧 INIZIALIZZAZIONE
  // ===================================================================
  
  const init = async () => {
    console.log('[Billing] Inizializzazione...');
    
    // Carica stato premium da storage locale
    loadPremiumStatus();
    
    // Inizializza Google Play Billing (solo se in TWA/Android)
    if (isAndroidTWA()) {
      await initGooglePlayBilling();
    } else {
      console.log('[Billing] Non in ambiente TWA, modalità demo attiva');
    }
    
    return isPremiumUser;
  };

  // ===================================================================
  // 🤖 GOOGLE PLAY BILLING
  // ===================================================================
  
  const initGooglePlayBilling = async () => {
    try {
      // Verifica disponibilità Digital Goods API (per PWA in TWA)
      if ('getDigitalGoodsService' in window) {
        const service = await window.getDigitalGoodsService('https://play.google.com/billing');
        billingClient = service;
        
        console.log('[Billing] Digital Goods API connessa');
        
        // Verifica acquisti esistenti
        await checkExistingPurchases();
      } else {
        console.warn('[Billing] Digital Goods API non disponibile');
      }
    } catch (error) {
      console.error('[Billing] Errore inizializzazione:', error);
    }
  };

  const checkExistingPurchases = async () => {
    if (!billingClient) return;
    
    try {
      const purchases = await billingClient.listPurchases();
      
      if (purchases && purchases.length > 0) {
        const premiumPurchase = purchases.find(p => p.itemId === PREMIUM_SKU);
        
        if (premiumPurchase) {
          console.log('[Billing] Acquisto premium trovato:', premiumPurchase);
          activatePremium(premiumPurchase.purchaseToken);
        }
      }
    } catch (error) {
      console.error('[Billing] Errore verifica acquisti:', error);
    }
  };

  // ===================================================================
  // 🛒 ACQUISTO PREMIUM
  // ===================================================================
  
  const purchasePremium = async () => {
    if (!billingClient) {
      // Modalità demo: simula acquisto
      return simulatePurchase();
    }
    
    try {
      console.log('[Billing] Avvio acquisto premium...');
      
      // Ottieni dettagli prodotto
      const details = await billingClient.getDetails([PREMIUM_SKU]);
      
      if (!details || details.length === 0) {
        throw new Error('Prodotto non trovato');
      }
      
      const product = details[0];
      
      // Avvia flusso acquisto
      const paymentRequest = new PaymentRequest([{
        supportedMethods: 'https://play.google.com/billing',
        data: {
          sku: product.itemId,
        }
      }], {
        total: {
          label: product.title,
          amount: {
            currency: product.price.currency,
            value: product.price.value
          }
        }
      });
      
      const paymentResponse = await paymentRequest.show();
      const { purchaseToken } = paymentResponse.details;
      
      // Conferma acquisto
      await paymentResponse.complete('success');
      
      // Attiva premium
      activatePremium(purchaseToken);
      
      return {
        success: true,
        token: purchaseToken
      };
      
    } catch (error) {
      console.error('[Billing] Errore acquisto:', error);
      
      if (error.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // ===================================================================
  // 🔄 RIPRISTINO ACQUISTI
  // ===================================================================
  
  const restorePurchases = async () => {
    if (!billingClient) {
      console.log('[Billing] Ripristino non disponibile in demo mode');
      return { success: false, message: 'Disponibile solo su Google Play' };
    }
    
    try {
      console.log('[Billing] Ripristino acquisti...');
      
      await checkExistingPurchases();
      
      if (isPremiumUser) {
        return { 
          success: true, 
          message: 'Acquisto premium ripristinato!' 
        };
      } else {
        return { 
          success: false, 
          message: 'Nessun acquisto trovato' 
        };
      }
      
    } catch (error) {
      console.error('[Billing] Errore ripristino:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // ===================================================================
  // 💾 GESTIONE STATO PREMIUM (✅ FIX #2: Safari private mode support)
  // ===================================================================
  
  // ✅ FIX CRITICO #4: Helper per verificare disponibilità storage con fallback
  const isStorageAvailable = (storageType = 'local') => {
    try {
      const storage = storageType === 'local' ? localStorage : sessionStorage;

      if (typeof storage === 'undefined') return false;

      // Test write per verificare disponibilità effettiva
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      // SecurityError in Safari private mode, QuotaExceededError, etc.
      console.warn(`[Billing] ${storageType}Storage non disponibile:`, e.name);
      return false;
    }
  };

  // ✅ FIX CRITICO #4: Determina miglior storage disponibile
  const getBestAvailableStorage = () => {
    if (isStorageAvailable('local')) {
      return { type: 'localStorage', storage: localStorage };
    }
    if (isStorageAvailable('session')) {
      console.warn('[Billing] localStorage non disponibile, uso sessionStorage (dati persi al chiudere tab)');
      return { type: 'sessionStorage', storage: sessionStorage };
    }
    console.warn('[Billing] Nessun storage persistente disponibile, uso memoria');
    return { type: 'memory', storage: null };
  };
  
  const activatePremium = (purchaseToken = null) => {
    isPremiumUser = true;

    const premiumData = {
      active: true,
      purchaseDate: Date.now(),
      purchaseToken: purchaseToken
    };

    // ✅ FIX CRITICO #4: Salva in tutti i layer disponibili per massima resilienza
    const { type: storageType, storage } = getBestAvailableStorage();

    try {
      if (storage) {
        storage.setItem(BILLING_STORAGE_KEY, JSON.stringify(premiumData));
        console.log(`[Billing] ✅ Premium salvato in ${storageType}`);

        // ✅ FIX CRITICO #4: Se usando sessionStorage, avvisa l'utente
        if (storageType === 'sessionStorage') {
          showSafariPrivateModeWarning();
        }
      } else {
        memoryStorage[BILLING_STORAGE_KEY] = premiumData;
        console.log('[Billing] ⚠️ Premium salvato in memoria (nessun storage persistente disponibile)');
      }

      // ✅ FIX CRITICO #4: Salva anche in memoria come backup
      memoryStorage[BILLING_STORAGE_KEY] = premiumData;

    } catch (error) {
      console.error('[Billing] ⚠️ Errore salvataggio, uso solo memoria:', error);
      memoryStorage[BILLING_STORAGE_KEY] = premiumData;
    }

    console.log('[Billing] ✅ Premium attivato!');

    // Notifica cambio stato
    try {
      document.dispatchEvent(new CustomEvent('premiumStatusChanged', {
        detail: { isPremium: true }
      }));
    } catch (error) {
      console.error('[Billing] Errore dispatch evento:', error);
    }

    // Rimuovi ads se attivi
    if (window.AdsModule) {
      try {
        window.AdsModule.hideAllAds();
      } catch (error) {
        console.error('[Billing] Errore nascondere ads:', error);
      }
    }
  };

  // ✅ FIX CRITICO #4: Warning per Safari private mode
  const showSafariPrivateModeWarning = () => {
    // Mostra solo una volta per sessione
    if (sessionStorage.getItem('safari_private_warning_shown')) return;
    sessionStorage.setItem('safari_private_warning_shown', 'true');

    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 70px;
      left: 0;
      right: 0;
      background: #FF9800;
      color: white;
      padding: 15px;
      text-align: center;
      z-index: 9999;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
      ⚠️ Modalità Privata Rilevata: Lo status Premium sarà perso alla chiusura del tab.
      <button onclick="this.parentElement.remove()" style="
        margin-left: 15px;
        padding: 5px 12px;
        background: white;
        color: #FF9800;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      ">OK</button>
    `;

    document.body.appendChild(banner);

    // Auto-remove dopo 10 secondi
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  };

  const loadPremiumStatus = () => {
    // ✅ FIX CRITICO #4: Fallback chain completo con tutti gli storage disponibili
    try {
      // 1. Prova localStorage (preferito)
      if (isStorageAvailable('local')) {
        const stored = localStorage.getItem(BILLING_STORAGE_KEY);
        if (stored) {
          const premiumData = JSON.parse(stored);
          isPremiumUser = premiumData.active === true;
          console.log('[Billing] Stato premium caricato da localStorage:', isPremiumUser);
          return;
        }
      }

      // 2. Prova sessionStorage (fallback Safari private mode)
      if (isStorageAvailable('session')) {
        const stored = sessionStorage.getItem(BILLING_STORAGE_KEY);
        if (stored) {
          const premiumData = JSON.parse(stored);
          isPremiumUser = premiumData.active === true;
          console.log('[Billing] Stato premium caricato da sessionStorage:', isPremiumUser);
          return;
        }
      }

      // 3. Fallback memoria (ultimo fallback)
      const stored = memoryStorage[BILLING_STORAGE_KEY];
      if (stored) {
        isPremiumUser = stored.active === true;
        console.log('[Billing] Stato premium caricato da memoria:', isPremiumUser);
        return;
      }

      isPremiumUser = false;
    } catch (error) {
      console.error('[Billing] Errore caricamento stato:', error);
      isPremiumUser = false;
    }
  };

  const revokePremium = () => {
    isPremiumUser = false;
    
    // Rimuovi da entrambi storage e memoria
    try {
      if (isStorageAvailable()) {
        localStorage.removeItem(BILLING_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('[Billing] Impossibile rimuovere da localStorage:', error);
    }
    
    memoryStorage[BILLING_STORAGE_KEY] = null;
    
    console.log('[Billing] Premium revocato (solo per test)');
    
    try {
      document.dispatchEvent(new CustomEvent('premiumStatusChanged', { 
        detail: { isPremium: false } 
      }));
    } catch (error) {
      console.error('[Billing] Errore dispatch evento:', error);
    }
  };

  // ===================================================================
  // 🧪 SIMULAZIONE (per test senza Google Play)
  // ===================================================================
  
  const simulatePurchase = () => {
    return new Promise((resolve) => {
      console.log('[Billing] 🧪 DEMO MODE: Simulazione acquisto...');
      
      const confirmed = confirm(
        '🧪 DEMO MODE\n\n' +
        'Simulare acquisto Premium (€2.99)?\n\n' +
        'In produzione questo aprirà Google Play Billing.'
      );
      
      if (confirmed) {
        setTimeout(() => {
          activatePremium('demo_token_' + Date.now());
          
          alert('✅ Acquisto simulato con successo!\n\nPremium attivato.');
          
          resolve({ success: true, demo: true });
        }, 1000);
      } else {
        resolve({ success: false, cancelled: true });
      }
    });
  };

  // ===================================================================
  // 🔍 UTILITY
  // ===================================================================
  
  const isAndroidTWA = () => {
    // Verifica se siamo in Trusted Web Activity
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = userAgent.includes('android');
    const hasTWAMarker = document.referrer.includes('android-app://');
    
    return isAndroid && (hasTWAMarker || 'getDigitalGoodsService' in window);
  };

  const isPremium = () => isPremiumUser;

  const getPremiumFeatures = () => {
    return {
      noAds: isPremiumUser,
      premiumThemes: isPremiumUser,
      advancedStats: isPremiumUser,
      exportPDF: isPremiumUser,
      cloudBackup: isPremiumUser
    };
  };

  // ===================================================================
  // 📊 API PUBBLICA
  // ===================================================================
  
  return {
    init,
    isPremium,
    purchasePremium,
    restorePurchases,
    getPremiumFeatures,
    
    // Solo per debug/test
    _revokePremium: revokePremium,
    _simulate: simulatePurchase,
    _isStorageAvailable: isStorageAvailable // Debug helper
  };
})();

// Esporta globalmente
window.BillingModule = BillingModule;
