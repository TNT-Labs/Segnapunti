import React, {useState} from 'react';
import {View, StyleSheet, Platform} from 'react-native';
import {BannerAd, BannerAdSize, TestIds} from 'react-native-google-mobile-ads';

/**
 * Componente per visualizzare banner pubblicitari AdMob
 *
 * @param {Object} props
 * @param {string} props.size - Dimensione del banner: 'small', 'medium', 'large' (default: 'small')
 * @param {string} props.adUnitId - ID dell'unità pubblicitaria (opzionale, usa test ID se non fornito)
 * @param {Object} props.style - Stili personalizzati per il container
 */
const AdBanner = ({size = 'small', adUnitId, style}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determina la dimensione del banner
  const getBannerSize = () => {
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

  // Usa l'ID test se non è fornito un ID reale
  // IMPORTANTE: Sostituire con i veri Ad Unit ID in produzione!
  const unitId = adUnitId || (
    Platform.OS === 'ios'
      ? TestIds.BANNER
      : TestIds.BANNER
  );

  // Handlers per gli eventi dell'annuncio
  const handleAdLoaded = () => {
    console.log('AdMob: Annuncio caricato con successo');
    setIsVisible(true);
    setHasError(false);
  };

  const handleAdFailedToLoad = error => {
    console.warn('AdMob: Errore nel caricamento annuncio:', error);
    setIsVisible(false);
    setHasError(true);
  };

  // Non mostrare nulla se c'è stato un errore
  if (hasError || !isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={unitId}
        size={getBannerSize()}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
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
});

export default AdBanner;
