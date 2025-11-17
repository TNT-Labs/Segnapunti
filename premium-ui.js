// ===================================================================
// ✨ PREMIUM UI MODULE - Badge, Paywall, Upsell
// ===================================================================

const PremiumUIModule = (() => {
  let isPremium = false;

  // ===================================================================
  // 🎨 BADGE PREMIUM IN HEADER
  // ===================================================================
  
  const addPremiumBadge = () => {
    const header = document.querySelector('.fixed-header h1');
    if (!header || header.querySelector('.premium-badge')) return;
    
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
  };

  // ===================================================================
  // 🔒 UPGRADE BUTTON IN NAV
  // ===================================================================
  
  const addUpgradeButton = () => {
    const bottomNav = document.querySelector('.bottom-nav');
    if (!bottomNav) return;
    
    // Verifica se esiste già
    if (document.querySelector('.nav-item-premium')) return;
    
    // Rimuovi nav-item esistente "Preset" se presente (per fare spazio)
    const presetNavItem = bottomNav.querySelector('a[href="preset-manager.html"]');
    
    // Sostituisci o aggiungi
    const premiumNavItem = document.createElement('a');
    premiumNavItem.href = 'premium.html';
    premiumNavItem.className = 'nav-item nav-item-premium';
    premiumNavItem.style.cssText = `
      position: relative;
      background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1));
      border-radius: 8px;
    `;
    premiumNavItem.innerHTML = `
      <span class="nav-icon" style="color: #FFD700;">✨</span>
      <span class="nav-label" style="color: #FFD700; font-weight: 700;">Premium</span>
      <span style="
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff4444;
        color: white;
        font-size: 0.65em;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 700;
      ">NEW</span>
    `;
    
    if (presetNavItem) {
      bottomNav.replaceChild(premiumNavItem, presetNavItem);
    } else {
      bottomNav.appendChild(premiumNavItem);
    }
  };

  // ===================================================================
  // 💎 FEATURE LOCKED OVERLAY
  // ===================================================================
  
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
    if (sessionStorage.getItem('promo_banner_closed')) return;
    
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
      sessionStorage.setItem('promo_banner_closed', 'true');
      
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
    const sessionCount = parseInt(localStorage.getItem('app_session_count') || '0');
    
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
      // Aggiungi upgrade button
      addUpgradeButton();
      
      // Mostra promo strategici
      checkAndShowPromo();
    }
    
    // Incrementa session count
    const sessionCount = parseInt(localStorage.getItem('app_session_count') || '0');
    localStorage.setItem('app_session_count', (sessionCount + 1).toString());
  };

  // ===================================================================
  // 📊 API PUBBLICA
  // ===================================================================
  
  return {
    init,
    lockFeature,
    showFeatureLockedModal,
    showPromoBanner,
    addPremiumBadge,
    addUpgradeButton
  };
})();

// Esporta globalmente
window.PremiumUIModule = PremiumUIModule;

// Auto-inizializza su DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Skip su pagina premium stessa
  if (!window.location.pathname.includes('premium.html')) {
    PremiumUIModule.init();
  }
});
