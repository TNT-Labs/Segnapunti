import {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentStatus,
  AdsConsentInfo,
} from 'react-native-google-mobile-ads';

/**
 * Service per gestire il consenso GDPR per la pubblicità personalizzata
 * Implementa le linee guida per la Consent Management Platform (CMP)
 */

export type ConsentStatusName = 'OBTAINED' | 'NOT_REQUIRED' | 'REQUIRED' | 'UNKNOWN' | 'ERROR';

export interface ConsentInitializeResult {
  isRequired: boolean;
  status: ConsentStatusName;
  canRequestAds: boolean;
}

export interface ConsentFormResult {
  status: ConsentStatusName;
  canRequestAds: boolean;
}

class ConsentService {
  private consentInfo: AdsConsentInfo | null = null;
  private isInitialized: boolean = false;

  /**
   * Inizializza il servizio di consenso e verifica se è necessario richiedere il consenso
   * @param debugMode - Se true, forza la geografia EEA per il test
   * @returns Promise con informazioni sul consenso
   */
  async initialize(debugMode: boolean = false): Promise<ConsentInitializeResult> {
    try {
      // Configura il debug mode se richiesto (solo per test)
      if (debugMode && __DEV__) {
        await AdsConsent.setDebugGeography(AdsConsentDebugGeography.EEA);
        if (__DEV__) {
          console.log('ConsentService: Debug mode attivo - simulazione geografica EEA');
        }
      }

      // Richiedi informazioni sul consenso
      this.consentInfo = await AdsConsent.requestInfoUpdate();
      this.isInitialized = true;

      const isRequired = this.consentInfo.isConsentFormAvailable;
      const status = this.consentInfo.status;

      if (__DEV__) {
        console.log('ConsentService: Inizializzazione completata', {
          isConsentFormAvailable: isRequired,
          status: this._getStatusName(status),
        });
      }

      return {
        isRequired,
        status: this._getStatusName(status),
        canRequestAds: this._canRequestAds(),
      };
    } catch (error) {
      if (__DEV__) {
        console.error('ConsentService: Errore durante inizializzazione:', error);
      }
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
   * @returns Promise con il risultato del consenso
   */
  async showConsentForm(): Promise<ConsentFormResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Verifica se il form è disponibile
      if (!this.consentInfo?.isConsentFormAvailable) {
        if (__DEV__) {
          console.log('ConsentService: Form di consenso non disponibile');
        }
        return {
          status: 'NOT_REQUIRED',
          canRequestAds: true,
        };
      }

      // Verifica se il consenso è già stato ottenuto
      if (this.consentInfo.status === AdsConsentStatus.OBTAINED) {
        if (__DEV__) {
          console.log('ConsentService: Consenso già ottenuto');
        }
        return {
          status: 'OBTAINED',
          canRequestAds: true,
        };
      }

      // Mostra il form di consenso
      if (__DEV__) {
        console.log('ConsentService: Mostro form di consenso');
      }
      await AdsConsent.showForm();

      // Aggiorna le informazioni sul consenso
      this.consentInfo = await AdsConsent.requestInfoUpdate();

      const newStatus = this._getStatusName(this.consentInfo.status);
      if (__DEV__) {
        console.log('ConsentService: Consenso aggiornato -', newStatus);
      }

      return {
        status: newStatus,
        canRequestAds: this._canRequestAds(),
      };
    } catch (error) {
      if (__DEV__) {
        console.error('ConsentService: Errore durante visualizzazione form:', error);
      }
      // In caso di errore, permetti annunci non personalizzati
      return {
        status: 'ERROR',
        canRequestAds: true,
      };
    }
  }

  /**
   * Resetta il consenso (utile per test o se l'utente vuole modificare le preferenze)
   */
  async resetConsent(): Promise<void> {
    try {
      await AdsConsent.reset();
      this.consentInfo = null;
      this.isInitialized = false;
      if (__DEV__) {
        console.log('ConsentService: Consenso resettato');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('ConsentService: Errore durante reset del consenso:', error);
      }
    }
  }

  /**
   * Verifica se è possibile richiedere annunci basandosi sullo stato del consenso
   */
  private _canRequestAds(): boolean {
    if (!this.consentInfo) {
      return true; // Permetti annunci se non ci sono info (fallback sicuro)
    }

    const status = this.consentInfo.status;

    // Si possono richiedere annunci se:
    // 1. Il consenso è stato ottenuto (OBTAINED)
    // 2. Il consenso non è richiesto (NOT_REQUIRED)
    return (
      status === AdsConsentStatus.OBTAINED || status === AdsConsentStatus.NOT_REQUIRED
    );
  }

  /**
   * Ottiene il nome leggibile dello stato del consenso
   */
  private _getStatusName(status: AdsConsentStatus): ConsentStatusName {
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
   */
  canShowPersonalizedAds(): boolean {
    if (!this.consentInfo) {
      return false; // Fallback: annunci non personalizzati
    }
    return this.consentInfo.status === AdsConsentStatus.OBTAINED;
  }

  /**
   * Ottiene lo stato corrente del consenso
   */
  getConsentInfo(): AdsConsentInfo | null {
    return this.consentInfo;
  }
}

// Singleton instance
const consentService = new ConsentService();

export default consentService;
