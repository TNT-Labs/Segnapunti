import StorageService from '../../services/StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('StorageService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('saveGameState', () => {
    test('persists game state data', async () => {
      const gameState = {
        players: [{id: '1', name: 'Alice', score: 0}],
        isFinished: false,
      };

      AsyncStorage.setItem.mockResolvedValue(null);

      const result = await StorageService.saveGameState(gameState);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@segnapunti:gameState',
        JSON.stringify(gameState),
      );
    });

    test('returns false on error', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const result = await StorageService.saveGameState({});

      expect(result).toBe(false);
    });
  });

  describe('loadGameState', () => {
    test('returns parsed game state when data exists', async () => {
      const gameState = {
        players: [{id: '1', name: 'Alice', score: 50}],
        isFinished: false,
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(gameState));

      const result = await StorageService.loadGameState();

      expect(result).toEqual(gameState);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@segnapunti:gameState');
    });

    test('returns null when no data exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await StorageService.loadGameState();

      expect(result).toBeNull();
    });

    test('returns null on parse error', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid json');

      const result = await StorageService.loadGameState();

      expect(result).toBeNull();
    });
  });

  describe('clearGameState', () => {
    test('removes game state from storage', async () => {
      AsyncStorage.removeItem.mockResolvedValue(null);

      const result = await StorageService.clearGameState();

      expect(result).toBe(true);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@segnapunti:gameState',
      );
    });
  });

  describe('addGameToHistory', () => {
    test('saves game to history', async () => {
      const existingHistory = [
        {id: '1', preset: {name: 'Briscola'}, timestamp: Date.now()},
      ];

      const newGame = {
        preset: {name: 'Scopa'},
        players: [],
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingHistory));
      AsyncStorage.setItem.mockResolvedValue(null);

      const result = await StorageService.addGameToHistory(newGame);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      // Verify the history was updated
      const callArgs = AsyncStorage.setItem.mock.calls[0];
      const savedHistory = JSON.parse(callArgs[1]);
      expect(savedHistory.length).toBeGreaterThanOrEqual(1);
    });

    test('creates new history if none exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);
      AsyncStorage.setItem.mockResolvedValue(null);

      const newGame = {
        preset: {name: 'Scopa'},
        players: [],
      };

      const result = await StorageService.addGameToHistory(newGame);

      expect(result).toBe(true);
      const callArgs = AsyncStorage.setItem.mock.calls[0];
      const savedHistory = JSON.parse(callArgs[1]);
      expect(savedHistory).toHaveLength(1);
    });
  });

  describe('loadGameHistory', () => {
    test('returns parsed game history', async () => {
      const history = [
        {id: '1', preset: {name: 'Briscola'}, timestamp: Date.now()},
        {id: '2', preset: {name: 'Scopa'}, timestamp: Date.now()},
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(history));

      const result = await StorageService.loadGameHistory();

      expect(result).toEqual(history);
    });

    test('returns empty array when no history exists', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await StorageService.loadGameHistory();

      expect(result).toEqual([]);
    });
  });

  describe('removeGameFromHistory', () => {
    test('removes specific game from history', async () => {
      const history = [
        {id: '1', preset: {name: 'Briscola'}, timestamp: Date.now()},
        {id: '2', preset: {name: 'Scopa'}, timestamp: Date.now()},
        {id: '3', preset: {name: 'Tressette'}, timestamp: Date.now()},
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(history));
      AsyncStorage.setItem.mockResolvedValue(null);

      const result = await StorageService.removeGameFromHistory('2');

      expect(result).toBe(true);
      const callArgs = AsyncStorage.setItem.mock.calls[0];
      const updatedHistory = JSON.parse(callArgs[1]);
      expect(updatedHistory).toHaveLength(2);
      expect(updatedHistory.find(g => g.id === '2')).toBeUndefined();
    });
  });

  describe('clearGameHistory', () => {
    test('removes all game history', async () => {
      AsyncStorage.setItem.mockResolvedValue(null);

      const result = await StorageService.clearGameHistory();

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@segnapunti:gameHistory',
        JSON.stringify([]),
      );
    });
  });

  describe('exportAllData', () => {
    test('exports all data with correct structure', async () => {
      const gameState = {players: [], isFinished: false};
      const gameHistory = [{id: '1', preset: {name: 'Briscola'}}];
      const presets = [{id: 'custom1', name: 'My Game'}];
      const settings = {darkMode: true};

      AsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(gameState))
        .mockResolvedValueOnce(JSON.stringify(gameHistory))
        .mockResolvedValueOnce(JSON.stringify(presets))
        .mockResolvedValueOnce(JSON.stringify(settings));

      const result = await StorageService.exportAllData();

      expect(result).toHaveProperty('gameState');
      expect(result).toHaveProperty('gameHistory');
      expect(result).toHaveProperty('presets');
      expect(result).toHaveProperty('settings');
      expect(result).toHaveProperty('exportedAt');
      expect(result).toHaveProperty('version');
      expect(result.version).toBe('1.0.0');
      expect(result.gameState).toEqual(gameState);
    });

    test('handles missing data gracefully', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await StorageService.exportAllData();

      expect(result.gameState).toBeNull();
      expect(result.gameHistory).toEqual([]);
      expect(result.presets).toEqual([]);
      expect(result.settings).toEqual({
        darkMode: false,
        language: 'it',
        soundEnabled: true,
        vibrationEnabled: true,
      });
    });
  });

  describe('importAllData', () => {
    test('imports all data correctly', async () => {
      const importData = {
        gameState: {players: [], isFinished: false},
        gameHistory: [{id: '1'}],
        presets: [{id: 'custom1'}],
        settings: {darkMode: true},
      };

      AsyncStorage.setItem.mockResolvedValue(null);

      const result = await StorageService.importAllData(importData);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(4);
    });
  });

  describe('Custom Presets', () => {
    test('saves custom presets', async () => {
      const presets = [{id: 'custom1', name: 'My Game'}];

      AsyncStorage.setItem.mockResolvedValue(null);

      const result = await StorageService.savePresets(presets);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@segnapunti:presets',
        JSON.stringify(presets),
      );
    });

    test('loads custom presets', async () => {
      const presets = [{id: 'custom1', name: 'My Game'}];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(presets));

      const result = await StorageService.loadPresets();

      expect(result).toEqual(presets);
    });

    test('returns empty array when no presets exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await StorageService.loadPresets();

      expect(result).toEqual([]);
    });
  });

  describe('Settings', () => {
    test('saves settings', async () => {
      const settings = {darkMode: true};

      AsyncStorage.setItem.mockResolvedValue(null);

      const result = await StorageService.saveSettings(settings);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@segnapunti:settings',
        JSON.stringify(settings),
      );
    });

    test('loads settings', async () => {
      const settings = {darkMode: true};

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(settings));

      const result = await StorageService.loadSettings();

      expect(result).toEqual(settings);
    });

    test('returns default settings when none exist', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await StorageService.loadSettings();

      expect(result).toEqual({
        darkMode: false,
        language: 'it',
        soundEnabled: true,
        vibrationEnabled: true,
      });
    });
  });
});
