// ===================================================================
// ✨ PREMIUM UI MODULE - Badge, Paywall, Upsell
// ===================================================================

const PremiumUIModule = (() => {
  let isPremium = false;
  let badgeAdded = false; // ✅ FIX #24: Flag per prevenire badge duplicati

  // ===================================================================
  // 🎨 BADGE PREMIUM IN HEADER
  // ===================================================================

  const addPremiumBadge = () => {
    const header = document.querySelector('.fixed-header h1');
    if (!header) return;

    // ✅ FIX #24: Previeni duplicazione con flag
    if (badgeAdded && header.querySelector('.premium-badge')) {
      return; // Badge già presente
    }

    // ✅ FIX: Rimuovi badge esistente prima di aggiungerne uno nuovo
    const existingBadge = header.querySelector('.premium-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    const badge = document.createElement('span');
    badge.className = 'premium-badge';
    badge.innerHTML = '✨ PRO';
    badge.style.cssText = `
      display: inline-block;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #333;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.5em;
      font-weight: 700;
      margin-left: 10px;
      vertical-align: middle;
      box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
      animation: premiumPulse 2s infinite;
    `;
    
    // Animazione pulse
    if (!document.querySelector('#premium-badge-animation')) {
      const style = document.createElement('style');
      style.id = 'premium-badge-animation';
      style.textContent = `
        @keyframes premiumPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `;
      document.head.appendChild(style);
    }
    
    header.appendChild(badge);
    badgeAdded = true; // ✅ FIX #24: Imposta flag dopo aggiunta
  };

  // ✅ NUOVO: Metodo per rimuovere badge
  const removePremiumBadge = () => {
    const badges = document.querySelectorAll('.premium-badge');
    badges.forEach(badge => badge.remove());
    badgeAdded = false; // ✅ FIX #24: Reset flag dopo rimozione
  };

  // ===================================================================
  // 🔒 UPGRADE BUTTON (DEPRECATO - rimosso)
  // ===================================================================
  
  // Metodi lockPresetTab/unlockPresetTab/addUpgradeButton rimossi
  // Non più necessari con sistema limite 1 preset free
  
  const showFeatureLockedModal = (featureName, description) => {
    const modal = document.createElement('div');
    modal.className = 'premium-locked-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 20px;
        padding: 40px 30px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        color: white;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: slideUp 0.3s;
      ">
        <div style="font-size: 4em; margin-bottom: 20px;">🔒</div>
        <h2 style="margin: 0 0 10px 0; font-size: 1.8em;">${featureName}</h2>
        <p style="opacity: 0.9; margin: 0 0 25px 0; line-height: 1.6;">
          ${description}
        </p>
        
        <div style="
          background: rgba(255,255,255,0.15);
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 25px;
          backdrop-filter: blur(10px);
        ">
          <div style="font-size: 2.5em; font-weight: 800; margin-bottom: 5px;">€2,99</div>
          <div style="font-size: 0.9em; opacity: 0.9;">Acquisto una tantum</div>
        </div>
        
        <button onclick="window.location.href='premium.html'" style="
          width: 100%;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #333;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 1.2em;
          font-weight: 800;
          cursor: pointer;
          margin-bottom: 12px;
          box-shadow: 0 4px 15px rgba(255,215,0,0.4);
        ">
          ✨ Sblocca Premium
        </button>
        
        <button class="btn-close-locked" style="
          width: 100%;
          background: rgba(255,255,255,0.15);
          color: white;
          border: 2px solid rgba(255,255,255,0.3);
          padding: 12px;
          border-radius: 10px;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
        ">
          Forse dopo
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animazioni
    if (!document.querySelector('#premium-modal-animations')) {
      const style = document.createElement('style');
      style.id = 'premium-modal-animations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Close handlers
    modal.querySelector('.btn-close-locked').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  };

  // ===================================================================
  // 🎁 BANNER PROMOZIONALE
  // ===================================================================
  
  const showPromoBanner = () => {
    // Non mostrare se già chiuso in questa sessione
    // ✅ FIX BUG #26: Safe storage access per Safari private mode
    try {
      if (sessionStorage.getItem('promo_banner_closed')) return;
    } catch (e) {
      console.warn('sessionStorage non disponibile:', e);
      // Continua comunque, mostra il banner
    }
    
    const banner = document.createElement('div');
    banner.id = 'premium-promo-banner';
    banner.style.cssText = `
      position: fixed;
      top: 70px;
      left: 0;
      right: 0;
      max-width: 550px;
      margin: 0 auto;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 99;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      animation: slideDown 0.5s;
    `;
    
    banner.innerHTML = `
      <div style="flex-grow: 1;">
        <div style="font-weight: 700; margin-bottom: 3px;">✨ Passa a Premium!</div>
        <div style="font-size: 0.85em; opacity: 0.9;">Nessuna pubblicità + Funzionalità esclusive</div>
      </div>
      <button onclick="window.location.href='premium.html'" style="
        background: #FFD700;
        color: #333;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        margin-right: 10px;
        font-size: 0.9em;
      ">
        €2.99
      </button>
      <button id="close-promo-banner" style="
        background: rgba(255,255,255,0.2);
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1.2em;
      ">
        ✕
      </button>
    `;
    
    if (!document.querySelector('#promo-banner-animation')) {
      const style = document.createElement('style');
      style.id = 'promo-banner-animation';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(banner);
    
    // Aggiungi padding al container per compensare
    const container = document.querySelector('.container');
    if (container) {
      container.style.paddingTop = '150px';
    }
    
    // Close handler
    banner.querySelector('#close-promo-banner').addEventListener('click', () => {
      banner.remove();
      // ✅ FIX BUG #26: Safe storage access per Safari private mode
      try {
        sessionStorage.setItem('promo_banner_closed', 'true');
      } catch (e) {
        console.warn('sessionStorage non disponibile:', e);
      }

      if (container) {
        container.style.paddingTop = '80px';
      }
    });
    
    // Auto-hide dopo 10 secondi
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
        if (container) {
          container.style.paddingTop = '80px';
        }
      }
    }, 10000);
  };

  // ===================================================================
  // 🎯 TRIGGER STRATEGICI
  // ===================================================================
  
  const checkAndShowPromo = () => {
    // Mostra promo banner dopo 3 sessioni
    // ✅ FIX BUG #26: Safe storage access per Safari private mode
    let sessionCount = 0;
    try {
      sessionCount = parseInt(localStorage.getItem('app_session_count') || '0');
    } catch (e) {
      console.warn('localStorage non disponibile:', e);
      // Usa valore di default 0
    }

    if (sessionCount >= 3 && sessionCount <= 10 && !isPremium) {
      setTimeout(() => {
        showPromoBanner();
      }, 5000); // 5 secondi dopo il caricamento
    }
  };

  const lockFeature = (featureName, description) => {
    if (isPremium) return false; // Feature sbloccata
    
    showFeatureLockedModal(featureName, description);
    return true; // Feature bloccata
  };

  // ===================================================================
  // 🔧 INIZIALIZZAZIONE
  // ===================================================================
  
  const init = async () => {
    // Verifica stato premium
    if (window.BillingModule) {
      await window.BillingModule.init();
      isPremium = window.BillingModule.isPremium();
    }
    
    if (isPremium) {
      // Mostra badge premium
      addPremiumBadge();
    } else {
      // Mostra promo strategici
      checkAndShowPromo();
    }
    
    // Incrementa session count
    // ✅ FIX BUG #26: Safe storage access per Safari private mode
    try {
      const sessionCount = parseInt(localStorage.getItem('app_session_count') || '0');
      localStorage.setItem('app_session_count', (sessionCount + 1).toString());
    } catch (e) {
      console.warn('localStorage non disponibile per session count:', e);
      // Non critico, continua senza incrementare
    }
    
    // ✅ FIX: Listener per cambio stato premium
    document.addEventListener('premiumStatusChanged', handlePremiumStatusChange);
  };
  
  // ✅ NUOVO: Lock/Unlock Preset Tab
  const lockPresetTab = () => {
    const presetTab = document.getElementById('nav-preset');
    if (!presetTab) return;
    
    const lockBadge = presetTab.querySelector('.lock-badge');
    if (lockBadge) {
      lockBadge.style.display = 'inline-block';
      lockBadge.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        font-size: 0.7em;
        background: rgba(255,255,255,0.2);
        padding: 2px 4px;
        border-radius: 4px;
      `;
    }
    
    // Intercetta click
    presetTab.addEventListener('click', handlePresetClick);
  };
  
  const unlockPresetTab = () => {
    const presetTab = document.getElementById('nav-preset');
    if (!presetTab) return;
    
    const lockBadge = presetTab.querySelector('.lock-badge');
    if (lockBadge) {
      lockBadge.style.display = 'none';
    }
    
    // Rimuovi intercettazione click
    presetTab.removeEventListener('click', handlePresetClick);
  };
  
  const handlePresetClick = (e) => {
    if (!isPremium) {
      e.preventDefault();
      e.stopPropagation();
      
      showFeatureLockedModal(
        'Gestione Preset Personalizzati',
        'Crea, modifica ed esporta preset illimitati per tutti i tuoi giochi preferiti. Disponibile solo con Premium!'
      );
    }
  };
  
  // ✅ NUOVO: Handler per cambio stato
  const handlePremiumStatusChange = (e) => {
    isPremium = e.detail.isPremium;
    
    if (isPremium) {
      addPremiumBadge();
      
      // ✅ Refresh preset list se siamo sulla pagina
      if (window.location.pathname.includes('preset-manager.html')) {
        if (window.PresetUI) {
          window.PresetUI.renderPresetList();
        }
      }
    } else {
      removePremiumBadge();
    }
  };

  // ===================================================================
  // 🧹 CLEANUP
  // ===================================================================

  // ✅ FIX BUG #28: Cleanup method per rimuovere event listeners
  const cleanup = () => {
    // Rimuovi listener per cambio stato premium
    document.removeEventListener('premiumStatusChanged', handlePremiumStatusChange);

    // Rimuovi listener preset tab se presente
    const presetTab = document.getElementById('nav-preset');
    if (presetTab) {
      presetTab.removeEventListener('click', handlePresetClick);
    }

    console.log('✅ PremiumUIModule cleanup completato');
  };

  // ===================================================================
  // 📊 API PUBBLICA
  // ===================================================================

  return {
    init,
    cleanup, // ✅ FIX BUG #28: Esposto cleanup method
    lockFeature,
    showFeatureLockedModal,
    showPromoBanner,
    addPremiumBadge,
    removePremiumBadge,
    lockPresetTab,
    unlockPresetTab
  };
})();

// Esporta globalmente
window.PremiumUIModule = PremiumUIModule;

// ✅ FIX: Non auto-inizializzare, lascia che sia chiamato esplicitamente
// dopo BillingModule.init() per evitare race condition
// L'inizializzazione avviene negli script inline di ogni HTML
