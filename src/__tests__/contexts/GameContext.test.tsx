import React from 'react';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {GameProvider, useGame} from '../../contexts/GameContext';
import StorageService from '../../services/StorageService';
import type {GamePreset, Player, GameState} from '../../contexts/GameContext';

// Mock dependencies
jest.mock('../../services/StorageService');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Test wrapper component
const wrapper = ({children}: {children: React.ReactNode}) => (
  <GameProvider>{children}</GameProvider>
);

describe('GameContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (StorageService.loadGameState as jest.Mock).mockResolvedValue(null);
    (StorageService.loadGameHistory as jest.Mock).mockResolvedValue([]);
    (StorageService.loadPresets as jest.Mock).mockResolvedValue([]);
    (StorageService.saveGameState as jest.Mock).mockResolvedValue(true);
    (StorageService.addGameToHistory as jest.Mock).mockResolvedValue(true);
  });

  describe('startNewGame', () => {
    test('creates correct number of players', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob', 'Charlie'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      await waitFor(() => {
        expect(result.current.players).toHaveLength(3);
        expect(result.current.players[0].name).toBe('Alice');
        expect(result.current.players[1].name).toBe('Bob');
        expect(result.current.players[2].name).toBe('Charlie');
      });
    });

    test('initializes players with score 0 in max mode', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      await waitFor(() => {
        result.current.players.forEach(player => {
          expect(player.score).toBe(0);
        });
      });
    });

    test('initializes players with targetScore in darts mode', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'darts', targetScore: 301} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      await waitFor(() => {
        result.current.players.forEach(player => {
          expect(player.score).toBe(301);
        });
      });
    });

    test('initializes rounds mode with correct structure', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {
        mode: 'rounds',
        targetRounds: 3,
        roundTargetScore: 21,
      } as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      await waitFor(() => {
        result.current.players.forEach(player => {
          expect(player.rounds).toEqual([]);
          expect(player.roundsWon).toBe(0);
        });
        expect(result.current.gameState?.currentRound).toBe(1);
      });
    });

    test('saves game state to storage', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      await waitFor(() => {
        expect(StorageService.saveGameState).toHaveBeenCalled();
      });
    });

    test('sets game state as not finished', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      await waitFor(() => {
        expect(result.current.gameState?.isFinished).toBe(false);
        expect(result.current.gameState?.winner).toBeNull();
      });
    });
  });

  describe('updatePlayerScore', () => {
    test('updates correct player score', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 25);
      });

      await waitFor(() => {
        const alice = result.current.players.find(p => p.id === aliceId);
        expect(alice?.score).toBe(25);
      });
    });

    test('does not update other players scores', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;
      const bobId = result.current.players[1].id;

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 25);
      });

      await waitFor(() => {
        const bob = result.current.players.find(p => p.id === bobId);
        expect(bob?.score).toBe(0);
      });
    });

    test('supports negative score changes', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 50);
      });

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, -20);
      });

      await waitFor(() => {
        const alice = result.current.players.find(p => p.id === aliceId);
        expect(alice?.score).toBe(30);
      });
    });
  });

  describe('checkWinCondition - max mode', () => {
    test('detects winner when score reaches target', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 100);
      });

      await waitFor(() => {
        expect(result.current.gameState?.isFinished).toBe(true);
        expect(result.current.gameState?.winner).toBe(aliceId);
      });
    });

    test('detects winner when score exceeds target', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 125);
      });

      await waitFor(() => {
        expect(result.current.gameState?.isFinished).toBe(true);
        expect(result.current.gameState?.winner).toBe(aliceId);
      });
    });

    test('does not detect winner before target', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 99);
      });

      await waitFor(() => {
        expect(result.current.gameState?.isFinished).toBe(false);
        expect(result.current.gameState?.winner).toBeNull();
      });
    });
  });

  describe('checkWinCondition - min mode', () => {
    test('detects winner with lowest score when someone exceeds target', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'min', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;
      const bobId = result.current.players[1].id;

      // Alice: 90, Bob: 110 (exceeds) → Alice wins
      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 90);
      });

      await act(async () => {
        await result.current.updatePlayerScore(bobId, 110);
      });

      await waitFor(() => {
        expect(result.current.gameState?.isFinished).toBe(true);
        expect(result.current.gameState?.winner).toBe(aliceId);
      });
    });

    test('no winner until someone exceeds target', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'min', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;
      const bobId = result.current.players[1].id;

      // Both under target
      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 50);
      });

      await act(async () => {
        await result.current.updatePlayerScore(bobId, 80);
      });

      await waitFor(() => {
        expect(result.current.gameState?.isFinished).toBe(false);
      });
    });
  });

  describe('checkWinCondition - darts mode', () => {
    test('detects winner when score reaches exactly 0', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'darts', targetScore: 50} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, -50);
      });

      await waitFor(() => {
        expect(result.current.gameState?.isFinished).toBe(true);
        expect(result.current.gameState?.winner).toBe(aliceId);
      });
    });

    test('prevents negative scores (BUST)', async () => {
      (Alert.alert as jest.Mock).mockClear();

      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'darts', targetScore: 50} as any;
      const playerNames = ['Alice'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      // Try to go below 0
      await act(async () => {
        await result.current.updatePlayerScore(aliceId, -60);
      });

      await waitFor(() => {
        const alice = result.current.players.find(p => p.id === aliceId);
        expect(alice?.score).toBe(50); // Score should remain unchanged
        expect(Alert.alert).toHaveBeenCalledWith(
          'BUST!',
          expect.stringContaining('Alice')
        );
      });
    });

    test('no winner if score is not exactly 0', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'darts', targetScore: 50} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      await act(async () => {
        await result.current.updatePlayerScore(aliceId, -45);
      });

      await waitFor(() => {
        expect(result.current.gameState?.isFinished).toBe(false);
      });
    });
  });

  describe('saveGameToHistory', () => {
    test('saves finished game to history', async () => {
      (StorageService.loadGameHistory as jest.Mock).mockResolvedValue([]);

      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 50} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      const aliceId = result.current.players[0].id;

      // Win the game
      await act(async () => {
        await result.current.updatePlayerScore(aliceId, 50);
      });

      // Save to history
      let saveResult: boolean | undefined;
      await act(async () => {
        saveResult = await result.current.saveGameToHistory();
      });

      await waitFor(() => {
        expect(saveResult).toBe(true);
        expect(StorageService.addGameToHistory).toHaveBeenCalled();
      });
    });

    test('does not save unfinished game', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      let saveResult: boolean | undefined;
      await act(async () => {
        saveResult = await result.current.saveGameToHistory();
      });

      await waitFor(() => {
        expect(saveResult).toBe(false);
        expect(StorageService.addGameToHistory).not.toHaveBeenCalled();
      });
    });
  });

  describe('resetGame', () => {
    test('clears game state', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      await act(async () => {
        await result.current.resetGame();
      });

      await waitFor(() => {
        expect(result.current.gameState).toBeNull();
        expect(result.current.players).toEqual([]);
        expect(result.current.currentPreset).toBeNull();
      });
    });

    test('clears storage', async () => {
      const {result} = renderHook(() => useGame(), {wrapper});

      const preset: GamePreset = {mode: 'max', targetScore: 100} as any;
      const playerNames = ['Alice', 'Bob'];

      await act(async () => {
        await result.current.startNewGame(preset, playerNames);
      });

      await act(async () => {
        await result.current.resetGame();
      });

      await waitFor(() => {
        expect(StorageService.clearGameState).toHaveBeenCalled();
      });
    });
  });

  describe('getAllPresets', () => {
    test('returns combined default and custom presets', async () => {
      const customPresets: GamePreset[] = [
        {id: 'custom1', name: 'My Game', mode: 'max'} as any,
      ];

      (StorageService.loadPresets as jest.Mock).mockResolvedValue(customPresets);

      const {result} = renderHook(() => useGame(), {wrapper});

      await waitFor(() => {
        const allPresets = result.current.getAllPresets();
        expect(allPresets.length).toBeGreaterThan(10); // DEFAULT_PRESETS + custom
        expect(allPresets.some(p => p.id === 'custom1')).toBe(true);
      });
    });
  });

  describe('addCustomPreset', () => {
    test('adds preset and updates state', async () => {
      const newPreset: GamePreset = {
        id: 'custom1',
        name: 'My Game',
        mode: 'max',
        targetScore: 100,
      } as any;

      (StorageService.loadPresets as jest.Mock).mockResolvedValueOnce([])
        .mockResolvedValueOnce([newPreset]);

      const {result} = renderHook(() => useGame(), {wrapper});

      await act(async () => {
        await result.current.addCustomPreset(newPreset);
      });

      await waitFor(() => {
        expect(StorageService.addPreset).toHaveBeenCalledWith(newPreset);
        expect(result.current.customPresets).toContainEqual(newPreset);
      });
    });
  });

  describe('removeCustomPreset', () => {
    test('removes preset and updates state', async () => {
      const preset: GamePreset = {id: 'custom1', name: 'My Game'} as any;

      (StorageService.loadPresets as jest.Mock).mockResolvedValueOnce([preset])
        .mockResolvedValueOnce([]);

      const {result} = renderHook(() => useGame(), {wrapper});

      await waitFor(() => {
        expect(result.current.customPresets).toHaveLength(1);
      });

      await act(async () => {
        await result.current.removeCustomPreset('custom1');
      });

      await waitFor(() => {
        expect(StorageService.removePreset).toHaveBeenCalledWith('custom1');
        expect(result.current.customPresets).toEqual([]);
      });
    });
  });
});
