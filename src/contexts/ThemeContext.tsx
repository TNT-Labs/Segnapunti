import React, {createContext, useState, useEffect, useContext, ReactNode} from 'react';
import {useColorScheme} from 'react-native';
import {COLORS, ThemeColors} from '../constants/colors';
import StorageService from '../services/StorageService';

// Interfaces and Types

interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleDarkMode: () => Promise<void>;
  isLoading: boolean;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carica dark mode preference al mount
  useEffect(() => {
    const loadDarkModePreference = async () => {
      try {
        const savedDarkMode = await StorageService.loadDarkMode();
        setIsDark(savedDarkMode);
      } catch (error) {
        if (__DEV__) {
          console.error('Error loading dark mode:', error);
        }
        // Fallback to system preference
        setIsDark(systemColorScheme === 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadDarkModePreference();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDarkMode = async (): Promise<void> => {
    const newValue = !isDark;
    setIsDark(newValue);
    await StorageService.saveDarkMode(newValue);
  };

  const theme: Theme = {
    dark: isDark,
    colors: isDark ? COLORS.dark : COLORS.light,
  };

  return (
    <ThemeContext.Provider value={{theme, isDark, toggleDarkMode, isLoading}}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
