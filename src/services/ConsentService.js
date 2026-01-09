import {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentStatus,
} from 'react-native-google-mobile-ads';

/**
 * Service per gestire il consenso GDPR per la pubblicità personalizzata
 * Implementa le linee guida per la Consent Management Platform (CMP)
 */
class ConsentService {
  constructor() {
    this.consentInfo = null;
    this.isInitialized = false;
  }

  /**
   * Inizializza il servizio di consenso e verifica se è necessario richiedere il consenso
   * @param {boolean} debugMode - Se true, forza la geografia EEA per il test
   * @returns {Promise<{isRequired: boolean, status: string}>}
   */
  async initialize(debugMode = false) {
    try {
      // Configura il debug mode se richiesto (solo per test)
      if (debugMode && __DEV__) {
        await AdsConsent.setDebugGeography(
          AdsConsentDebugGeography.EEA,
        );
        console.log('ConsentService: Debug mode attivo - simulazione geografica EEA');
      }

      // Richiedi informazioni sul consenso
      this.consentInfo = await AdsConsent.requestInfoUpdate();
      this.isInitialized = true;

      const isRequired = this.consentInfo.isConsentFormAvailable;
      const status = this.consentInfo.status;

      console.log('ConsentService: Inizializzazione completata', {
        isConsentFormAvailable: isRequired,
        status: this._getStatusName(status),
      });

      return {
        isRequired,
        status: this._getStatusName(status),
        canRequestAds: this._canRequestAds(),
      };
    } catch (error) {
      console.error('ConsentService: Errore durante inizializzazione:', error);
      // In caso di errore, permetti comunque gli annunci non personalizzati
      return {
        isRequired: false,
        status: 'ERROR',
        canRequestAds: true,
      };
    }
  }

  /**
   * Mostra il form di consenso all'utente
   * @returns {Promise<{status: string, canRequestAds: boolean}>}
   */
  async showConsentForm() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Verifica se il form è disponibile
      if (!this.consentInfo?.isConsentFormAvailable) {
        console.log('ConsentService: Form di consenso non disponibile');
        return {
          status: 'NOT_REQUIRED',
          canRequestAds: true,
        };
      }

      // Verifica se il consenso è già stato ottenuto
      if (this.consentInfo.status === AdsConsentStatus.OBTAINED) {
        console.log('ConsentService: Consenso già ottenuto');
        return {
          status: 'OBTAINED',
          canRequestAds: true,
        };
      }

      // Mostra il form di consenso
      console.log('ConsentService: Mostro form di consenso');
      const result = await AdsConsent.showForm();

      // Aggiorna le informazioni sul consenso
      this.consentInfo = await AdsConsent.requestInfoUpdate();

      const newStatus = this._getStatusName(this.consentInfo.status);
      console.log('ConsentService: Consenso aggiornato -', newStatus);

      return {
        status: newStatus,
        canRequestAds: this._canRequestAds(),
      };
    } catch (error) {
      console.error('ConsentService: Errore durante visualizzazione form:', error);
      // In caso di errore, permetti annunci non personalizzati
      return {
        status: 'ERROR',
        canRequestAds: true,
      };
    }
  }

  /**
   * Resetta il consenso (utile per test o se l'utente vuole modificare le preferenze)
   * @returns {Promise<void>}
   */
  async resetConsent() {
    try {
      await AdsConsent.reset();
      this.consentInfo = null;
      this.isInitialized = false;
      console.log('ConsentService: Consenso resettato');
    } catch (error) {
      console.error('ConsentService: Errore durante reset del consenso:', error);
    }
  }

  /**
   * Verifica se è possibile richiedere annunci basandosi sullo stato del consenso
   * @returns {boolean}
   */
  _canRequestAds() {
    if (!this.consentInfo) {
      return true; // Permetti annunci se non ci sono info (fallback sicuro)
    }

    const status = this.consentInfo.status;

    // Si possono richiedere annunci se:
    // 1. Il consenso è stato ottenuto (OBTAINED)
    // 2. Il consenso non è richiesto (NOT_REQUIRED)
    return (
      status === AdsConsentStatus.OBTAINED ||
      status === AdsConsentStatus.NOT_REQUIRED
    );
  }

  /**
   * Ottiene il nome leggibile dello stato del consenso
   * @param {number} status
   * @returns {string}
   */
  _getStatusName(status) {
    switch (status) {
      case AdsConsentStatus.OBTAINED:
        return 'OBTAINED';
      case AdsConsentStatus.NOT_REQUIRED:
        return 'NOT_REQUIRED';
      case AdsConsentStatus.REQUIRED:
        return 'REQUIRED';
      case AdsConsentStatus.UNKNOWN:
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Verifica se l'utente ha dato il consenso per annunci personalizzati
   * @returns {boolean}
   */
  canShowPersonalizedAds() {
    if (!this.consentInfo) {
      return false; // Fallback: annunci non personalizzati
    }
    return this.consentInfo.status === AdsConsentStatus.OBTAINED;
  }

  /**
   * Ottiene lo stato corrente del consenso
   * @returns {Object|null}
   */
  getConsentInfo() {
    return this.consentInfo;
  }
}

// Singleton instance
const consentService = new ConsentService();

export default consentService;
