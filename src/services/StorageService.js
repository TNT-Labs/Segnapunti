import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Service
 * Gestisce il salvataggio e caricamento dati con AsyncStorage
 */

const STORAGE_KEYS = {
  GAME_STATE: '@segnapunti:gameState',
  GAME_HISTORY: '@segnapunti:gameHistory',
  PRESETS: '@segnapunti:presets',
  SETTINGS: '@segnapunti:settings',
  DARK_MODE: '@segnapunti:darkMode',
};

class StorageService {
  /**
   * Salva dati generici
   */
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error('Error saving data:', error);
      return false;
    }
  }

  /**
   * Carica dati generici
   */
  async getItem(key, defaultValue = null) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
    } catch (error) {
      console.error('Error loading data:', error);
      return defaultValue;
    }
  }

  /**
   * Rimuovi dati
   */
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing data:', error);
      return false;
    }
  }

  // ==================== GAME STATE ====================

  /**
   * Salva stato partita corrente
   */
  async saveGameState(gameState) {
    return await this.setItem(STORAGE_KEYS.GAME_STATE, gameState);
  }

  /**
   * Carica stato partita corrente
   */
  async loadGameState() {
    return await this.getItem(STORAGE_KEYS.GAME_STATE, null);
  }

  /**
   * Elimina stato partita corrente
   */
  async clearGameState() {
    return await this.removeItem(STORAGE_KEYS.GAME_STATE);
  }

  // ==================== GAME HISTORY ====================

  /**
   * Salva storico partite
   */
  async saveGameHistory(history) {
    return await this.setItem(STORAGE_KEYS.GAME_HISTORY, history);
  }

  /**
   * Carica storico partite
   */
  async loadGameHistory() {
    return await this.getItem(STORAGE_KEYS.GAME_HISTORY, []);
  }

  /**
   * Aggiungi partita allo storico
   */
  async addGameToHistory(game) {
    const history = await this.loadGameHistory();
    const newHistory = [
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
  async removeGameFromHistory(gameId) {
    const history = await this.loadGameHistory();
    const newHistory = history.filter(game => game.id !== gameId);
    return await this.saveGameHistory(newHistory);
  }

  /**
   * Pulisci tutto lo storico
   */
  async clearGameHistory() {
    return await this.saveGameHistory([]);
  }

  // ==================== PRESETS ====================

  /**
   * Salva presets personalizzati
   */
  async savePresets(presets) {
    return await this.setItem(STORAGE_KEYS.PRESETS, presets);
  }

  /**
   * Carica presets personalizzati
   */
  async loadPresets() {
    return await this.getItem(STORAGE_KEYS.PRESETS, []);
  }

  /**
   * Aggiungi preset personalizzato
   */
  async addPreset(preset) {
    const presets = await this.loadPresets();
    const newPresets = [
      ...presets,
      {
        ...preset,
        id: `custom_${Date.now()}`,
        isCustom: true,
      },
    ];
    return await this.savePresets(newPresets);
  }

  /**
   * Rimuovi preset personalizzato
   */
  async removePreset(presetId) {
    const presets = await this.loadPresets();
    const newPresets = presets.filter(p => p.id !== presetId);
    return await this.savePresets(newPresets);
  }

  // ==================== SETTINGS ====================

  /**
   * Salva impostazioni
   */
  async saveSettings(settings) {
    return await this.setItem(STORAGE_KEYS.SETTINGS, settings);
  }

  /**
   * Carica impostazioni
   */
  async loadSettings() {
    return await this.getItem(STORAGE_KEYS.SETTINGS, {
      darkMode: false,
      language: 'it',
      soundEnabled: true,
      vibrationEnabled: true,
    });
  }

  /**
   * Salva dark mode
   */
  async saveDarkMode(isDark) {
    return await this.setItem(STORAGE_KEYS.DARK_MODE, isDark);
  }

  /**
   * Carica dark mode
   */
  async loadDarkMode() {
    return await this.getItem(STORAGE_KEYS.DARK_MODE, false);
  }

  // ==================== UTILITY ====================

  /**
   * Pulisci tutti i dati
   */
  async clearAllData() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  /**
   * Esporta tutti i dati
   */
  async exportAllData() {
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
        version: '2.0.0',
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  /**
   * Importa dati
   */
  async importAllData(data) {
    try {
      if (data.gameState) await this.saveGameState(data.gameState);
      if (data.gameHistory) await this.saveGameHistory(data.gameHistory);
      if (data.presets) await this.savePresets(data.presets);
      if (data.settings) await this.saveSettings(data.settings);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export default new StorageService();
