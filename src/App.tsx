import React, {useEffect, useState} from 'react';
import {StatusBar, ActivityIndicator, View, StyleSheet} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import {ThemeProvider, useTheme} from './contexts/ThemeContext';
import {GameProvider} from './contexts/GameContext';
import AppNavigator from './navigation/AppNavigator';
import consentService from './services/ConsentService';
import i18nService from './services/i18nService';

const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4A148C" />
  </View>
);

const AppContent: React.FC = () => {
  const {theme, isDark} = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <PaperProvider>
        <GameProvider>
          <AppNavigator />
        </GameProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const App: React.FC = () => {
  const [consentHandled, setConsentHandled] = useState<boolean>(false);

  useEffect(() => {
    // Gestisce il flusso di consenso GDPR, i18n e inizializza AdMob
    const initializeApp = async (): Promise<void> => {
      try {
        // 0. Inizializza i18n
        if (__DEV__) {
          console.log('App: Inizializzo i18n...');
        }
        await i18nService.initializeI18n();
        if (__DEV__) {
          console.log('App: i18n inizializzato -', i18nService.getCurrentLanguage());
        }

        // 1. Inizializza il servizio di consenso
        if (__DEV__) {
          console.log('App: Inizializzo servizio di consenso GDPR...');
        }
        const consentInfo = await consentService.initialize();

        if (__DEV__) {
          console.log('App: Stato consenso -', {
            isRequired: consentInfo.isRequired,
            status: consentInfo.status,
            canRequestAds: consentInfo.canRequestAds,
          });
        }

        // 2. Se il consenso è richiesto e non ancora ottenuto, mostra il form
        if (consentInfo.isRequired && consentInfo.status === 'REQUIRED') {
          if (__DEV__) {
            console.log('App: Mostro form di consenso GDPR...');
          }
          const result = await consentService.showConsentForm();
          if (__DEV__) {
            console.log('App: Consenso completato -', result.status);
          }
        }

        // 3. Inizializza Google Mobile Ads
        if (__DEV__) {
          console.log('App: Inizializzo Google Mobile Ads...');
        }
        const adapterStatuses = await mobileAds().initialize();
        if (__DEV__) {
          console.log('App: AdMob inizializzato con successo:', adapterStatuses);
        }

        setConsentHandled(true);
      } catch (error) {
        if (__DEV__) {
          console.error('App: Errore durante inizializzazione:', error);
        }
        // In caso di errore, permetti comunque il caricamento dell'app
        setConsentHandled(true);
      }
    };

    initializeApp();
  }, []);

  // Mostra splash screen durante l'inizializzazione
  if (!consentHandled) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default App;
