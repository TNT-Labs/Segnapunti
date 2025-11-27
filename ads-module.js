// ===================================================================
// 📺 ADS MODULE - Google AdMob Integration (✅ FIXED v1.3.0)
// ===================================================================

const AdsModule = (() => {
  // IDs da configurare in AdMob Console
  const AD_UNITS = {
    banner: 'ca-app-pub-4302173868436591/6124127045', // Banner bottom
    interstitial: 'ca-app-pub-4302173868436591/5621671964' // Fullscreen
  };

  let adsEnabled = true;
  let bannerShown = false;
  let interstitialReady = false;
  let navigationCount = 0;
  let gamesCount = 0;
  let isInitialized = false; // ✅ FIX #1: Flag inizializzazione
  
  const INTERSTITIAL_FREQUENCY = {
    navigation: 3, // Ogni 3 navigazioni
    gameSave: 3    // Ogni 3 partite salvate
  };

  // ✅ FIX BUG #42: Costante per magic number
  const INTERSTITIAL_RELOAD_DELAY_MS = 1000; // 1 secondo

  // ===================================================================
  // 🔧 INIZIALIZZAZIONE
  // ===================================================================
  
  const init = async () => {
    try {
      Logger.log('[Ads] Inizializzazione...');

      // Inizializza AdMob
      await initAdMob();

      // Setup listeners
      setupEventListeners();

      // Mostra banner iniziale
      showBanner();

      // Preload interstitial
      loadInterstitial();

      Logger.log('[Ads] ✅ Inizializzazione completata');
    } catch (error) {
      // ✅ MIGLIORAMENTO AUDIT #2: Gestione errori completa con recovery graceful
      Logger.error('[Ads] ❌ Errore inizializzazione ads:', error);
      // Non bloccare l'app - gli ads sono funzionalità non critica
      // L'app continua a funzionare senza ads
    }
  };

  // ===================================================================
  // 📱 ADMOB INITIALIZATION
  // ===================================================================
  
  const initAdMob = async () => {
    try {
      // In ambiente TWA/Android, usa AdMob nativo
      if (window.admob) {
        Logger.log('[Ads] AdMob nativo disponibile');
        
        await window.admob.start();
        
        // Configura consenso GDPR/Privacy
        await window.admob.setConsent({
          personalized: true // Gestire consent form in produzione
        });
        
        return true;
      } 
      // Fallback: AdSense per web
      else {
        Logger.log('[Ads] Usando AdSense web fallback');
        loadAdSenseScript();
        return true;
      }
    } catch (error) {
      Logger.error('[Ads] Errore inizializzazione:', error);
      return false;
    }
  };

  const loadAdSenseScript = () => {
    if (document.querySelector('script[src*="adsbygoogle"]')) return;
    
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.setAttribute('data-ad-client', 'ca-pub-4302173868436591');
    document.head.appendChild(script);
  };

  // ===================================================================
  // 🎯 BANNER ADS (✅ FIX #5: Padding conflict resolved)
  // ===================================================================
  
  const showBanner = async () => {
    if (!adsEnabled || bannerShown) return;
    
    try {
      // Crea container banner se non esiste
      let bannerContainer = document.getElementById('ad-banner-container');
      
      if (!bannerContainer) {
        bannerContainer = createBannerContainer();
        document.body.appendChild(bannerContainer);
      }
      
      // AdMob nativo
      if (window.admob) {
        await window.admob.banner.show({
          id: AD_UNITS.banner,
          position: 'bottom',
          size: 'smart_banner'
        });
        
        Logger.log('[Ads] Banner mostrato (AdMob)');
      } 
      // Fallback AdSense
      else {
        renderAdSenseBanner(bannerContainer);
        Logger.log('[Ads] Banner mostrato (AdSense)');
      }
      
      bannerShown = true;
      
      // ✅ FIX #5: Usa SOLO classe CSS (non più inline style)
      document.body.classList.add('has-ad-banner');
      
    } catch (error) {
      Logger.error('[Ads] Errore mostra banner:', error);
    }
  };

  const createBannerContainer = () => {
    const container = document.createElement('div');
    container.id = 'ad-banner-container';
    container.style.cssText = `
      position: fixed;
      bottom: 70px;
      left: 0;
      right: 0;
      max-width: 550px;
      margin: 0 auto;
      height: 50px;
      background: #f0f0f0;
      border-top: 1px solid #ddd;
      z-index: 98;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    return container;
  };

  const renderAdSenseBanner = (container) => {
    container.innerHTML = `
      <ins class="adsbygoogle"
           style="display:inline-block;width:320px;height:50px"
           data-ad-client="ca-pub-4302173868436591"
           data-ad-slot="6300978111"></ins>
    `;
    
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      Logger.error('[Ads] Errore push AdSense:', e);
    }
  };

  const hideBanner = () => {
    if (!bannerShown) return;
    
    // Remove banner from DOM
    const bannerContainer = document.getElementById('ad-banner-container');
    if (bannerContainer) {
      bannerContainer.remove();
    }
    
    // Hide AdMob banner if native
    if (window.admob) {
      try {
        window.admob.banner.hide();
      } catch (e) {
        Logger.warn('AdMob banner hide failed:', e);
      }
    }
    
    // Remove CSS class (CSS handles padding)
    document.body.classList.remove('has-ad-banner');
    
    bannerShown = false;
    Logger.log('[Ads] Banner hidden');
  };

  // ===================================================================
  // 🎬 INTERSTITIAL ADS
  // ===================================================================
  
  const loadInterstitial = async () => {
    if (!adsEnabled) return;
    
    try {
      if (window.admob) {
        await window.admob.interstitial.load({
          id: AD_UNITS.interstitial
        });
        
        interstitialReady = true;
        Logger.log('[Ads] Interstitial caricato');
      }
    } catch (error) {
      Logger.error('[Ads] Errore caricamento interstitial:', error);
      interstitialReady = false;
    }
  };

  const showInterstitial = async (trigger = 'generic') => {
    if (!adsEnabled || !interstitialReady) return;
    
    try {
      Logger.log('[Ads] Mostra interstitial:', trigger);
      
      if (window.admob) {
        await window.admob.interstitial.show();
        
        // Ricarica per prossima volta
        interstitialReady = false;
        setTimeout(() => loadInterstitial(), INTERSTITIAL_RELOAD_DELAY_MS);
      } else {
        // Fallback: mostra overlay "fake" per test
        showTestInterstitial();
      }
      
    } catch (error) {
      Logger.error('[Ads] Errore mostra interstitial:', error);
    }
  };

  const showTestInterstitial = () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: Inter, sans-serif;
    `;
    
    overlay.innerHTML = `
      <div style="text-align: center; padding: 30px;">
        <h2>📺 [TEST] Interstitial Ad</h2>
        <p style="margin: 20px 0; opacity: 0.7;">
          In produzione qui comparirà<br>
          un annuncio pubblicitario AdMob
        </p>
        <button id="close-test-ad" style="
          padding: 12px 24px;
          background: #4A148C;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
        ">Chiudi (5s)</button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    let countdown = 5;
    const btn = overlay.querySelector('#close-test-ad');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    
    const timer = setInterval(() => {
      countdown--;
      btn.textContent = `Chiudi (${countdown}s)`;
      
      if (countdown <= 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.textContent = 'Chiudi';
        
        btn.onclick = () => {
          overlay.remove();
        };
      }
    }, 1000);
  };

  // ===================================================================
  // 🎯 TRIGGER STRATEGICI
  // ===================================================================
  
  const onNavigation = () => {
    if (!adsEnabled) return;
    
    navigationCount++;
    
    if (navigationCount >= INTERSTITIAL_FREQUENCY.navigation) {
      navigationCount = 0;
      showInterstitial('navigation');
    }
  };

  const onGameSaved = () => {
    if (!adsEnabled) return;
    
    gamesCount++;
    
    if (gamesCount >= INTERSTITIAL_FREQUENCY.gameSave) {
      gamesCount = 0;
      showInterstitial('game_saved');
    }
  };

  const onHistoryView = () => {
    if (!adsEnabled) return;

    // ✅ FIX BUG #47: Protezione Safari private mode per sessionStorage
    try {
      // Interstitial ogni 2 accessi allo storico
      const historyViews = parseInt(sessionStorage.getItem('history_views') || '0');

      if (historyViews > 0 && historyViews % 2 === 0) {
        showInterstitial('history_view');
      }

      sessionStorage.setItem('history_views', (historyViews + 1).toString());
    } catch (e) {
      Logger.warn('[Ads] sessionStorage non disponibile (Safari private mode?):', e);
      // Continua senza tracciare views - non critico per l'app
    }
  };

  // ===================================================================
  // 🎛️ SETUP LISTENERS (✅ FIX #1 & #5: Prevent multiple initialization + cleanup)
  // ===================================================================
  
  // ✅ FIX #5: Salva riferimenti ai listener per poterli rimuovere
  let navigationHandler = null;
  let gameCompletedHandler = null;
  
  const setupEventListeners = () => {
    // ✅ FIX BUG #23: Sempre pulisci listener esistenti prima di aggiungerne di nuovi
    // Non usare early return basato su isInitialized per prevenire race condition
    if (isInitialized) {
      Logger.log('[Ads] Re-initialization detected, cleaning up existing listeners');
    }

    // ✅ FIX #5 + BUG #23: Rimuovi SEMPRE vecchi listener per prevenire duplicati
    if (navigationHandler) {
      document.removeEventListener('click', navigationHandler, { capture: true });
      navigationHandler = null;
    }
    if (gameCompletedHandler) {
      document.removeEventListener('gameCompleted', gameCompletedHandler);
      gameCompletedHandler = null;
    }

    // Use event delegation for navigation
    navigationHandler = (e) => {
      const navItem = e.target.closest('.nav-item');
      if (navItem) {
        onNavigation();
      }
    };
    document.addEventListener('click', navigationHandler, { capture: true });

    // Custom events with named handlers
    gameCompletedHandler = onGameSaved;
    document.addEventListener('gameCompleted', gameCompletedHandler);
    
    // Track history page
    if (window.location.pathname.includes('storico.html')) {
      onHistoryView();
    }
    
    isInitialized = true;
    Logger.log('[Ads] Event listeners configured');
  };

  // ✅ FIX #5: Aggiungi metodo reset per test
  const resetInitialization = () => {
    isInitialized = false;
    Logger.log('[Ads] Initialization reset');
  };
  
  // ✅ FIX #9: Aggiungi metodo cleanup
  const cleanup = () => {
    if (navigationHandler) {
      document.removeEventListener('click', navigationHandler, { capture: true });
      navigationHandler = null;
    }
    if (gameCompletedHandler) {
      document.removeEventListener('gameCompleted', gameCompletedHandler);
      gameCompletedHandler = null;
    }

    hideAllAds();
    isInitialized = false;
    Logger.log('[Ads] Cleanup completed');
  };

  // ===================================================================
  // 🚫 CONTROLLO ADS
  // ===================================================================
  
  const hideAllAds = () => {
    adsEnabled = false;
    hideBanner();
    
    // Assicura che la classe venga rimossa
    document.body.classList.remove('has-ad-banner');
    
    Logger.log('[Ads] Tutti gli ads nascosti');
  };

  const enableAds = () => {
    adsEnabled = true;
    showBanner();
    loadInterstitial();
    
    Logger.log('[Ads] Ads riabilitati');
  };

  // ===================================================================
  // 📊 API PUBBLICA (✅ FIX #1 & #9: Added _resetInit and cleanup)
  // ===================================================================
  
  return {
    init,
    showBanner,
    hideBanner,
    showInterstitial,
    hideAllAds,
    enableAds,
    
    // Triggers
    onNavigation,
    onGameSaved,
    onHistoryView,
    
    // Lifecycle
    cleanup, // ✅ FIX #9: Aggiungi cleanup method
    
    // Debug only
    _resetInit: resetInitialization
  };
})();

// Esporta globalmente
window.AdsModule = AdsModule;
