import AsyncStorage from '@react-native-async-storage/async-storage';
import {GamePreset} from '../constants/presets';

/**
 * Storage Service
 * Gestisce il salvataggio e caricamento dati con AsyncStorage
 */

// Types and Interfaces
export interface Player {
  id: string;
  name: string;
  score: number;
  roundsWon?: number;
}

export interface GameState {
  preset: GamePreset;
  players: Player[];
  startedAt: string;
  lastModified?: string;
  isActive: boolean;
}

export interface HistoricalGame {
  id: string;
  preset: GamePreset;
  players: Player[];
  winner?: Player;
  timestamp: string;
  duration?: number;
  completed: boolean;
}

export interface Settings {
  darkMode: boolean;
  language: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface ExportedData {
  gameState: GameState | null;
  gameHistory: HistoricalGame[];
  presets: GamePreset[];
  settings: Settings;
  exportedAt: string;
  version: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  error?: string;
}

const STORAGE_KEYS = {
  GAME_STATE: '@segnapunti:gameState',
  GAME_HISTORY: '@segnapunti:gameHistory',
  PRESETS: '@segnapunti:presets',
  SETTINGS: '@segnapunti:settings',
  DARK_MODE: '@segnapunti:darkMode',
} as const;

class StorageService {
  /**
   * Salva dati generici
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving data:', error);
      }
      return false;
    }
  }

  /**
   * Carica dati generici
   */
  async getItem<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : defaultValue;
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading data:', error);
      }
      return defaultValue;
    }
  }

  /**
   * Rimuovi dati
   */
  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error removing data:', error);
      }
      return false;
    }
  }

  // ==================== GAME STATE ====================

  /**
   * Salva stato partita corrente
   */
  async saveGameState(gameState: GameState): Promise<boolean> {
    return await this.setItem(STORAGE_KEYS.GAME_STATE, gameState);
  }

  /**
   * Carica stato partita corrente
   */
  async loadGameState(): Promise<GameState | null> {
    return await this.getItem<GameState>(STORAGE_KEYS.GAME_STATE, null);
  }

  /**
   * Elimina stato partita corrente
   */
  async clearGameState(): Promise<boolean> {
    return await this.removeItem(STORAGE_KEYS.GAME_STATE);
  }

  // ==================== GAME HISTORY ====================

  /**
   * Salva storico partite
   */
  async saveGameHistory(history: HistoricalGame[]): Promise<boolean> {
    return await this.setItem(STORAGE_KEYS.GAME_HISTORY, history);
  }

  /**
   * Carica storico partite
   */
  async loadGameHistory(): Promise<HistoricalGame[]> {
    return (await this.getItem<HistoricalGame[]>(STORAGE_KEYS.GAME_HISTORY, [])) || [];
  }

  /**
   * Aggiungi partita allo storico
   */
  async addGameToHistory(game: Omit<HistoricalGame, 'id' | 'timestamp'>): Promise<boolean> {
    const history = await this.loadGameHistory();
    const newHistory: HistoricalGame[] = [
      {
        ...game,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      },
      ...history,
    ];
    return await this.saveGameHistory(newHistory);
  }

  /**
   * Rimuovi partita dallo storico
   */
  async removeGameFromHistory(gameId: string): Promise<boolean> {
    const history = await this.loadGameHistory();
    const newHistory = history.filter((game) => game.id !== gameId);
    return await this.saveGameHistory(newHistory);
  }

  /**
   * Pulisci tutto lo storico
   */
  async clearGameHistory(): Promise<boolean> {
    return await this.saveGameHistory([]);
  }

  // ==================== PRESETS ====================

  /**
   * Salva presets personalizzati
   */
  async savePresets(presets: GamePreset[]): Promise<boolean> {
    return await this.setItem(STORAGE_KEYS.PRESETS, presets);
  }

  /**
   * Carica presets personalizzati
   */
  async loadPresets(): Promise<GamePreset[]> {
    return (await this.getItem<GamePreset[]>(STORAGE_KEYS.PRESETS, [])) || [];
  }

  /**
   * Aggiungi preset personalizzato
   */
  async addPreset(preset: Omit<GamePreset, 'id'>): Promise<boolean> {
    const presets = await this.loadPresets();
    const newPresets: GamePreset[] = [
      ...presets,
      {
        ...preset,
        id: `custom_${Date.now()}`,
      } as GamePreset,
    ];
    return await this.savePresets(newPresets);
  }

  /**
   * Rimuovi preset personalizzato
   */
  async removePreset(presetId: string): Promise<boolean> {
    const presets = await this.loadPresets();
    const newPresets = presets.filter((p) => p.id !== presetId);
    return await this.savePresets(newPresets);
  }

  // ==================== SETTINGS ====================

  /**
   * Salva impostazioni
   */
  async saveSettings(settings: Settings): Promise<boolean> {
    return await this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  /**
   * Carica impostazioni
   */
  async loadSettings(): Promise<Settings> {
    return (
      (await this.getItem<Settings>(STORAGE_KEYS.SETTINGS, null)) || {
        darkMode: false,
        language: 'it',
        soundEnabled: true,
        vibrationEnabled: true,
      }
    );
  }

  /**
   * Salva dark mode
   */
  async saveDarkMode(isDark: boolean): Promise<boolean> {
    return await this.setItem(STORAGE_KEYS.DARK_MODE, isDark);
  }

  /**
   * Carica dark mode
   */
  async loadDarkMode(): Promise<boolean> {
    return (await this.getItem<boolean>(STORAGE_KEYS.DARK_MODE, false)) || false;
  }

  // ==================== UTILITY ====================

  /**
   * Pulisci tutti i dati
   */
  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error clearing all data:', error);
      }
      return false;
    }
  }

  /**
   * Esporta tutti i dati
   */
  async exportAllData(): Promise<ExportedData | null> {
    try {
      const gameState = await this.loadGameState();
      const gameHistory = await this.loadGameHistory();
      const presets = await this.loadPresets();
      const settings = await this.loadSettings();

      return {
        gameState,
        gameHistory,
        presets,
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error exporting data:', error);
      }
      return null;
    }
  }

  /**
   * Valida la struttura dei dati prima dell'importazione
   */
  private _validateImportData(data: unknown): ValidationResult {
    if (!data || typeof data !== 'object') {
      return {valid: false, error: 'Dati non validi o mancanti'};
    }

    const typedData = data as Partial<ExportedData>;

    // Verifica versione (opzionale ma consigliato)
    if (typedData.version && typeof typedData.version !== 'string') {
      return {valid: false, error: 'Versione non valida'};
    }

    // Valida gameHistory
    if (typedData.gameHistory) {
      if (!Array.isArray(typedData.gameHistory)) {
        return {valid: false, error: 'Storico partite deve essere un array'};
      }
      for (const game of typedData.gameHistory) {
        if (!game.id || !game.preset || !Array.isArray(game.players)) {
          return {valid: false, error: 'Formato storico partite non valido'};
        }
      }
    }

    // Valida presets
    if (typedData.presets) {
      if (!Array.isArray(typedData.presets)) {
        return {valid: false, error: 'Preset deve essere un array'};
      }
      for (const preset of typedData.presets) {
        if (!preset.id || !preset.name || !preset.mode) {
          return {valid: false, error: 'Formato preset non valido'};
        }
      }
    }

    // Valida settings
    if (typedData.settings && typeof typedData.settings !== 'object') {
      return {valid: false, error: 'Impostazioni devono essere un oggetto'};
    }

    return {valid: true};
  }

  /**
   * Importa dati con validazione
   */
  async importAllData(data: unknown): Promise<ImportResult> {
    try {
      // Valida i dati prima di importarli
      const validation = this._validateImportData(data);
      if (!validation.valid) {
        if (__DEV__) {
          console.error('Validation error:', validation.error);
        }
        return {success: false, error: validation.error};
      }

      const typedData = data as Partial<ExportedData>;

      // Importa i dati validati
      if (typedData.gameState) await this.saveGameState(typedData.gameState);
      if (typedData.gameHistory) await this.saveGameHistory(typedData.gameHistory);
      if (typedData.presets) await this.savePresets(typedData.presets);
      if (typedData.settings) await this.saveSettings(typedData.settings);

      return {success: true};
    } catch (error) {
      if (__DEV__) {
        console.error('Error importing data:', error);
      }
      return {success: false, error: (error as Error).message};
    }
  }
}

export default new StorageService();
