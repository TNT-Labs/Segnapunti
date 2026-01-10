import React, {useEffect, useState} from 'react';
import {StatusBar} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import mobileAds from 'react-native-google-mobile-ads';
import {ThemeProvider, useTheme} from './contexts/ThemeContext';
import {GameProvider} from './contexts/GameContext';
import AppNavigator from './navigation/AppNavigator';
import consentService from './services/ConsentService';

const AppContent = () => {
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

const App = () => {
  const [consentHandled, setConsentHandled] = useState(false);

  useEffect(() => {
    // Gestisce il flusso di consenso GDPR e inizializza AdMob
    const initializeApp = async () => {
      try {
        // 1. Inizializza il servizio di consenso
        console.log('App: Inizializzo servizio di consenso GDPR...');
        const consentInfo = await consentService.initialize();

        console.log('App: Stato consenso -', {
          isRequired: consentInfo.isRequired,
          status: consentInfo.status,
          canRequestAds: consentInfo.canRequestAds,
        });

        // 2. Se il consenso è richiesto e non ancora ottenuto, mostra il form
        if (consentInfo.isRequired && consentInfo.status === 'REQUIRED') {
          console.log('App: Mostro form di consenso GDPR...');
          const result = await consentService.showConsentForm();
          console.log('App: Consenso completato -', result.status);
        }

        // 3. Inizializza Google Mobile Ads
        console.log('App: Inizializzo Google Mobile Ads...');
        const adapterStatuses = await mobileAds().initialize();
        console.log('App: AdMob inizializzato con successo:', adapterStatuses);

        setConsentHandled(true);
      } catch (error) {
        console.error('App: Errore durante inizializzazione:', error);
        // In caso di errore, permetti comunque il caricamento dell'app
        setConsentHandled(true);
      }
    };

    initializeApp();
  }, []);

  // Mostra l'app solo dopo aver gestito il consenso
  // (opzionale: si può mostrare uno splash screen qui)
  if (!consentHandled) {
    return null; // o un componente di caricamento
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
