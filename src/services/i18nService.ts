import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {Platform, NativeModules} from 'react-native';
import StorageService from './StorageService';

// Import translations
import it from '../locales/it.json';
import en from '../locales/en.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';
import zh from '../locales/zh.json';

export type SupportedLanguage = 'it' | 'en' | 'de' | 'es' | 'fr' | 'ar' | 'zh';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['it', 'en', 'de', 'es', 'fr', 'ar', 'zh'];

// Get device language
const getDeviceLanguage = (): SupportedLanguage => {
  let deviceLanguage: string = 'it'; // Default to Italian

  try {
    if (Platform.OS === 'ios') {
      deviceLanguage =
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'it';
    } else {
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'it';
    }

    // Extract language code (e.g., "it_IT" -> "it")
    deviceLanguage = deviceLanguage.split('_')[0].toLowerCase();

    // Check if language is supported
    if (!SUPPORTED_LANGUAGES.includes(deviceLanguage as SupportedLanguage)) {
      deviceLanguage = 'it'; // Fallback to Italian
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error detecting device language:', error);
    }
    deviceLanguage = 'it';
  }

  return deviceLanguage as SupportedLanguage;
};

// Initialize i18next
const initializeI18n = async (): Promise<boolean> => {
  try {
    // Try to load saved language preference
    const savedLanguage = await StorageService.getItem<SupportedLanguage>(
      '@segnapunti:language',
      null,
    );

    const languageToUse = savedLanguage || getDeviceLanguage();

    await i18n.use(initReactI18next).init({
      compatibilityJSON: 'v3',
      resources: {
        it: {translation: it},
        en: {translation: en},
        de: {translation: de},
        es: {translation: es},
        fr: {translation: fr},
        ar: {translation: ar},
        zh: {translation: zh},
      },
      lng: languageToUse,
      fallbackLng: 'it',
      interpolation: {
        escapeValue: false, // React already handles XSS
      },
      react: {
        useSuspense: false,
      },
    });

    if (__DEV__) {
      console.log('[i18n] Initialized with language:', languageToUse);
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('[i18n] Initialization error:', error);
    }
    return false;
  }
};

// Change language
const changeLanguage = async (lng: SupportedLanguage): Promise<boolean> => {
  try {
    await i18n.changeLanguage(lng);
    await StorageService.setItem('@segnapunti:language', lng);

    if (__DEV__) {
      console.log('[i18n] Language changed to:', lng);
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('[i18n] Language change error:', error);
    }
    return false;
  }
};

// Get current language
const getCurrentLanguage = (): SupportedLanguage => {
  return (i18n.language || 'it') as SupportedLanguage;
};

// Get available languages
const getAvailableLanguages = (): LanguageOption[] => {
  return [
    {code: 'it', name: 'Italiano', flag: '🇮🇹'},
    {code: 'en', name: 'English', flag: '🇬🇧'},
    {code: 'de', name: 'Deutsch', flag: '🇩🇪'},
    {code: 'es', name: 'Español', flag: '🇪🇸'},
    {code: 'fr', name: 'Français', flag: '🇫🇷'},
    {code: 'ar', name: 'العربية', flag: '🇸🇦'},
    {code: 'zh', name: '中文', flag: '🇨🇳'},
  ];
};

export default {
  initializeI18n,
  changeLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
  i18n,
};
