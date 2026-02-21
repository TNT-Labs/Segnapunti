import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ActivityIndicator, ViewStyle} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import consentService from '../services/ConsentService';

type BannerSize = 'small' | 'medium' | 'large' | 'full';
type LoadingState = 'loading' | 'loaded' | 'failed';

interface AdBannerProps {
  size?: BannerSize;
  adUnitId: string;
  style?: ViewStyle;
}

/**
 * Componente per visualizzare banner pubblicitari AdMob
 *
 * @param {Object} props
 * @param {string} props.size - Dimensione del banner: 'small', 'medium', 'large' (default: 'small')
 * @param {string} props.adUnitId - ID dell'unità pubblicitaria (OBBLIGATORIO)
 * @param {Object} props.style - Stili personalizzati per il container
 */
const AdBanner: React.FC<AdBannerProps> = ({size = 'small', adUnitId, style}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [hasError, setHasError] = useState<boolean>(false);

  // Validazione: adUnitId è obbligatorio
  useEffect(() => {
    if (!adUnitId) {
      if (__DEV__) {
        console.error('[AdBanner] ERRORE: adUnitId è obbligatorio ma non è stato fornito!');
      }
      setHasError(true);
      setLoadingState('failed');
    }
  }, [adUnitId]);

  // Determina la dimensione del banner
  const getBannerSize = (): string => {
    switch (size) {
      case 'small':
        return BannerAdSize.BANNER; // 320x50
      case 'medium':
        return BannerAdSize.MEDIUM_RECTANGLE; // 300x250
      case 'large':
        return BannerAdSize.LARGE_BANNER; // 320x100
      case 'full':
        return BannerAdSize.FULL_BANNER; // 468x60
      default:
        return BannerAdSize.BANNER;
    }
  };

  // Ottieni le dimensioni del placeholder in base al size
  const getPlaceholderHeight = (): number => {
    switch (size) {
      case 'small':
        return 50;
      case 'medium':
        return 250;
      case 'large':
        return 100;
      case 'full':
        return 60;
      default:
        return 50;
    }
  };

  // Handlers per gli eventi dell'annuncio
  const handleAdLoaded = (): void => {
    if (__DEV__) {
      console.log('[AdBanner] Annuncio caricato con successo');
    }
    setLoadingState('loaded');
    setHasError(false);
  };

  const handleAdFailedToLoad = (error: any): void => {
    if (__DEV__) {
      console.warn('[AdBanner] Errore nel caricamento annuncio:', error);
    }
    setLoadingState('failed');
    setHasError(true);
  };

  // Verifica se l'utente ha dato il consenso per annunci personalizzati
  const canShowPersonalizedAds = consentService.canShowPersonalizedAds();

  // Se c'è un errore critico, mostra placeholder vuoto
  if (hasError && loadingState === 'failed') {
    return (
      <View
        style={[
          styles.container,
          styles.placeholder,
          {height: getPlaceholderHeight()},
          style,
        ]}
        accessible={true}
        accessibilityLabel="Spazio riservato per banner pubblicitario"
        accessibilityRole="none"
      />
    );
  }

  // Renderizza sempre BannerAd in modo che possa caricarsi e chiamare onAdLoaded.
  // L'ActivityIndicator viene mostrato in overlay finché il caricamento non è completo.
  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel="Banner pubblicitario"
      accessibilityRole="image">
      <BannerAd
        unitId={adUnitId}
        size={getBannerSize()}
        requestOptions={{
          requestNonPersonalizedAdsOnly: !canShowPersonalizedAds,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
      {loadingState === 'loading' && (
        <View
          style={[styles.loadingOverlay, {height: getPlaceholderHeight()}]}
          accessible={true}
          accessibilityLabel="Caricamento banner pubblicitario"
          accessibilityRole="progressbar">
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    backgroundColor: 'transparent',
  },
  placeholder: {
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

export default AdBanner;
