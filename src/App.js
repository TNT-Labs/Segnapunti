import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import mobileAds from 'react-native-google-mobile-ads';
import {ThemeProvider, useTheme} from './contexts/ThemeContext';
import {GameProvider} from './contexts/GameContext';
import AppNavigator from './navigation/AppNavigator';

const AppContent = () => {
  const {theme, isDark} = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.primary}
      />
      <PaperProvider>
        <GameProvider>
          <AppNavigator />
        </GameProvider>
      </PaperProvider>
    </>
  );
};

const App = () => {
  useEffect(() => {
    // Inizializza Google Mobile Ads
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('AdMob initialized:', adapterStatuses);
      })
      .catch(error => {
        console.error('AdMob initialization error:', error);
      });
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
