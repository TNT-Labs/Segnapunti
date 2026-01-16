import {Platform} from 'react-native';
import {TestIds} from 'react-native-google-mobile-ads';

/**
 * Configurazione centralizzata per Google Mobile Ads
 *
 * IMPORTANTE:
 * - In produzione, usa sempre gli Ad Unit IDs reali
 * - In sviluppo (__DEV__), usa TestIds per evitare ban dell'account
 * - Non modificare gli Ad Unit IDs senza verificare su AdMob Console
 */

// Flag per determinare se usare test ads (solo in modalità sviluppo)
const USE_TEST_ADS = __DEV__;

/**
 * Ad Unit IDs di produzione per Android
 * Account: ca-app-pub-4302173868436591
 */
const PRODUCTION_AD_UNITS_ANDROID = {
  GAME_SCREEN: 'ca-app-pub-4302173868436591/2924694505',
  HISTORY_SCREEN: 'ca-app-pub-4302173868436591/6124127045',
  PRESET_MANAGER_SCREEN: 'ca-app-pub-4302173868436591/1173463289',
  SETTINGS_SCREEN: 'ca-app-pub-4302173868436591/2155550079',
  ABOUT_SCREEN: 'ca-app-pub-4302173868436591/3668598839',
};

/**
 * Ad Unit IDs di produzione per iOS
 * TODO: Sostituire con i veri Ad Unit IDs dopo averli creati su AdMob Console
 * Account iOS: TBD (attualmente usando test ID in app.json)
 */
const PRODUCTION_AD_UNITS_IOS = {
  GAME_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  HISTORY_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  PRESET_MANAGER_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  SETTINGS_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
  ABOUT_SCREEN: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
};

/**
 * Test Ad Unit IDs (usati solo in modalità sviluppo)
 */
const TEST_AD_UNITS = {
  GAME_SCREEN: TestIds.BANNER,
  HISTORY_SCREEN: TestIds.BANNER,
  PRESET_MANAGER_SCREEN: TestIds.BANNER,
  SETTINGS_SCREEN: TestIds.BANNER,
  ABOUT_SCREEN: TestIds.BANNER,
};

/**
 * Seleziona gli Ad Unit IDs appropriati in base alla piattaforma e modalità
 */
const getAdUnits = () => {
  if (USE_TEST_ADS) {
    if (__DEV__) {
      console.log('[AdConfig] Usando Test Ads (__DEV__ mode)');
    }
    return TEST_AD_UNITS;
  }

  if (Platform.OS === 'ios') {
    if (__DEV__) {
      console.log('[AdConfig] Usando Production Ads per iOS');
    }
    return PRODUCTION_AD_UNITS_IOS;
  }

  if (__DEV__) {
    console.log('[AdConfig] Usando Production Ads per Android');
  }
  return PRODUCTION_AD_UNITS_ANDROID;
};

// Esporta gli Ad Unit IDs attivi
export const AD_UNITS = getAdUnits();

/**
 * Configurazione delle dimensioni dei banner per schermata
 * Valori possibili: 'small' (320x50), 'medium' (300x250), 'large' (320x100), 'full' (468x60)
 */
export const AD_BANNER_SIZES = {
  GAME_SCREEN: 'small',
  HISTORY_SCREEN: 'medium',
  PRESET_MANAGER_SCREEN: 'small',
  SETTINGS_SCREEN: 'small',
  ABOUT_SCREEN: 'small',
};

/**
 * Utility per ottenere la configurazione completa per un banner
 * @param {string} screenName - Nome della schermata (es. 'GAME_SCREEN')
 * @returns {Object} Oggetto con adUnitId e size
 */
export const getAdConfig = screenName => {
  if (!AD_UNITS[screenName]) {
    if (__DEV__) {
      console.error(`[AdConfig] Schermata non trovata: ${screenName}`);
    }
    return null;
  }

  return {
    adUnitId: AD_UNITS[screenName],
    size: AD_BANNER_SIZES[screenName] || 'small',
  };
};

/**
 * Verifica se gli Ad Unit IDs di produzione sono configurati correttamente
 * @returns {Object} Stato della configurazione
 */
export const validateAdConfig = () => {
  const issues = [];

  // Verifica iOS in produzione
  if (!USE_TEST_ADS && Platform.OS === 'ios') {
    Object.entries(PRODUCTION_AD_UNITS_IOS).forEach(([key, value]) => {
      if (value.includes('XXXXXXXX') || value.includes('YYYYYY')) {
        issues.push(`iOS ${key} non configurato (placeholder presente)`);
      }
    });
  }

  // Verifica Android in produzione
  if (!USE_TEST_ADS && Platform.OS === 'android') {
    Object.entries(PRODUCTION_AD_UNITS_ANDROID).forEach(([key, value]) => {
      if (value.includes('XXXXXXXX') || value.includes('YYYYYY')) {
        issues.push(`Android ${key} non configurato (placeholder presente)`);
      }
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    mode: USE_TEST_ADS ? 'TEST' : 'PRODUCTION',
    platform: Platform.OS,
  };
};

// Log della configurazione all'avvio (solo in modalità sviluppo)
if (__DEV__) {
  const config = validateAdConfig();
  console.log('[AdConfig] Configurazione:', config);
}

export default {
  AD_UNITS,
  AD_BANNER_SIZES,
  getAdConfig,
  validateAdConfig,
  USE_TEST_ADS,
};
