import React from 'react';
import {StatusBar} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
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
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
