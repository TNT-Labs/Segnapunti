import React, {createContext, useState, useEffect, useContext} from 'react';
import {useColorScheme} from 'react-native';
import {COLORS} from '../constants/colors';
import StorageService from '../services/StorageService';

const ThemeContext = createContext();

export const ThemeProvider = ({children}) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carica dark mode preference al mount
  useEffect(() => {
    loadDarkModePreference();
  }, []);

  const loadDarkModePreference = async () => {
    try {
      const savedDarkMode = await StorageService.loadDarkMode();
      setIsDark(savedDarkMode);
    } catch (error) {
      console.error('Error loading dark mode:', error);
      // Fallback to system preference
      setIsDark(systemColorScheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    await StorageService.saveDarkMode(newValue);
  };

  const theme = {
    dark: isDark,
    colors: isDark ? COLORS.dark : COLORS.light,
  };

  return (
    <ThemeContext.Provider value={{theme, isDark, toggleDarkMode, isLoading}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
