// ===================================================================
// 💳 BILLING MODULE - Google Play In-App Purchases
// ===================================================================

const BillingModule = (() => {
  const PREMIUM_SKU = 'premium_no_ads'; // ID prodotto in Google Play Console
  const BILLING_STORAGE_KEY = 'premium_status';
  
  let isPremiumUser = false;
  let billingClient = null;
  let purchaseUpdateListener = null;

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
  // 💾 GESTIONE STATO PREMIUM
  // ===================================================================
  
  const activatePremium = (purchaseToken = null) => {
    isPremiumUser = true;
    
    const premiumData = {
      active: true,
      purchaseDate: Date.now(),
      purchaseToken: purchaseToken
    };
    
    try {
      localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(premiumData));
      console.log('[Billing] ✅ Premium attivato!');
    } catch (error) {
      console.error('[Billing] ⚠️ Errore salvataggio premium:', error);
      // ✅ FIX: Anche se il salvataggio fallisce, mantieni stato in memoria
    }
    
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

  const loadPremiumStatus = () => {
    try {
      // ✅ FIX: Verifica disponibilità localStorage
      if (typeof localStorage === 'undefined') {
        console.warn('[Billing] localStorage non disponibile');
        isPremiumUser = false;
        return;
      }
      
      const stored = localStorage.getItem(BILLING_STORAGE_KEY);
      
      if (stored) {
        const premiumData = JSON.parse(stored);
        isPremiumUser = premiumData.active === true;
        
        console.log('[Billing] Stato premium caricato:', isPremiumUser);
      }
    } catch (error) {
      console.error('[Billing] Errore caricamento stato:', error);
      isPremiumUser = false;
    }
  };

  const revokePremium = () => {
    isPremiumUser = false;
    localStorage.removeItem(BILLING_STORAGE_KEY);
    
    console.log('[Billing] Premium revocato (solo per test)');
    
    document.dispatchEvent(new CustomEvent('premiumStatusChanged', { 
      detail: { isPremium: false } 
    }));
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
    _simulate: simulatePurchase
  };
})();

// Esporta globalmente
window.BillingModule = BillingModule;
