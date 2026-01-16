// Theme colors for Segnapunti app

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface AppColors {
  light: ThemeColors;
  dark: ThemeColors;
}

export const COLORS: AppColors = {
  // Light theme
  light: {
    primary: '#4A148C',
    primaryDark: '#12005e',
    primaryLight: '#7c43bd',
    secondary: '#FF6F00',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
    warning: '#F57C00',
    info: '#1976D2',
  },
  // Dark theme
  dark: {
    primary: '#7c43bd',
    primaryDark: '#4A148C',
    primaryLight: '#b47aea',
    secondary: '#FFB74D',
    background: '#121212',
    card: '#2C2C2C',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#3A3A3A',
    error: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
    info: '#42A5F5',
  },
};

export type GameMode = 'max' | 'min' | 'rounds' | 'darts';

export type GameModeColors = Record<GameMode, string>;

// Game mode colors
export const GAME_MODE_COLORS: GameModeColors = {
  max: '#4CAF50',
  min: '#F44336',
  rounds: '#2196F3',
  darts: '#FF9800',
};

export type PresetCategory = 'cards' | 'table' | 'sports' | 'other';

export type CategoryColors = Record<PresetCategory, string>;

// Preset category colors
export const CATEGORY_COLORS: CategoryColors = {
  cards: '#E91E63',
  table: '#9C27B0',
  sports: '#3F51B5',
  other: '#009688',
};
