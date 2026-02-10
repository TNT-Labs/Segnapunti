import React, {createContext, useState, useEffect, useContext, useRef, ReactNode} from 'react';
import {Alert} from 'react-native';
import i18next from 'i18next';
import StorageService from '../services/StorageService';
import {DEFAULT_PRESETS} from '../constants/presets';
import {GamePreset} from '../constants/presets';

// Helper to get translations in non-component code
const t = (key: string, options?: Record<string, any>): string => {
  return i18next.t(key, options) as string;
};

// Interfaces and Types

export interface Round {
  roundNumber: number;
  score: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  rounds?: Round[];
  roundsWon?: number;
  bustFlag: boolean;
}

export interface GameState {
  preset: GamePreset;
  players: Player[];
  startTime: string;
  isFinished: boolean;
  winner: string | null;
  currentRound?: number;
  endTime?: string;
  isSaved?: boolean;
}

export type {GamePreset};

interface ScoreHistoryEntry {
  playerId: string;
  previousScore: number;
  scoreChange: number;
  timestamp: number;
}

interface GameContextValue {
  // State
  gameState: GameState | null;
  players: Player[];
  currentPreset: GamePreset | null;
  gameHistory: any[];
  customPresets: GamePreset[];
  isLoading: boolean;
  canUndo: boolean;

  // Game actions
  startNewGame: (preset: GamePreset, playerNames: string[]) => Promise<void>;
  updatePlayerScore: (playerId: string, scoreChange: number) => Promise<void>;
  undoLastScore: () => Promise<void>;
  endGame: (winner: Player) => Promise<void>;
  saveGameToHistory: () => Promise<boolean>;
  resetGame: () => Promise<void>;

  // History actions
  removeGameFromHistory: (gameId: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Preset actions
  getAllPresets: () => GamePreset[];
  addCustomPreset: (preset: GamePreset) => Promise<void>;
  removeCustomPreset: (presetId: string) => Promise<void>;
}

interface GameProviderProps {
  children: ReactNode;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

export const GameProvider: React.FC<GameProviderProps> = ({children}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPreset, setCurrentPreset] = useState<GamePreset | null>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [customPresets, setCustomPresets] = useState<GamePreset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const scoreHistory = useRef<ScoreHistoryEntry[]>([]);

  const canUndo = scoreHistory.current.length > 0;

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);

        const savedGame = await StorageService.loadGameState();
        if (savedGame) {
          setGameState(savedGame as any);
          setPlayers((savedGame.players as any) || []);
          setCurrentPreset(savedGame.preset || null);
        }

        const history = await StorageService.loadGameHistory();
        setGameHistory(history);

        const presets = await StorageService.loadPresets();
        setCustomPresets(presets);

      } catch (error) {
        if (__DEV__) {
          console.error('Error loading game data:', error);
        }
        Alert.alert(
          t('common.error'),
          t('game.loadError'),
          [{text: t('common.ok')}]
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== GAME MANAGEMENT ====================

  const startNewGame = async (preset: GamePreset, playerNames: string[]): Promise<void> => {
    const newPlayers: Player[] = playerNames.map((name) => ({
      id: generateUniqueId('player'),
      name,
      score: preset.mode === 'darts' ? preset.targetScore : 0,
      rounds: preset.mode === 'rounds' ? [] : undefined,
      roundsWon: preset.mode === 'rounds' ? 0 : undefined,
      bustFlag: false,
    }));

    const newGameState: GameState = {
      preset,
      players: newPlayers,
      startTime: new Date().toISOString(),
      isFinished: false,
      winner: null,
      currentRound: preset.mode === 'rounds' ? 1 : undefined,
    };

    scoreHistory.current = [];
    setGameState(newGameState);
    setPlayers(newPlayers);
    setCurrentPreset(preset);
    await StorageService.saveGameState(newGameState as any);
  };

  const updatePlayerScore = async (playerId: string, scoreChange: number): Promise<void> => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      scoreHistory.current.push({
        playerId,
        previousScore: player.score,
        scoreChange,
        timestamp: Date.now(),
      });
    }

    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        let newScore = p.score + scoreChange;

        if (currentPreset!.mode === 'darts' && newScore < 0) {
          Alert.alert(
            t('game.bust'),
            t('game.bustMessage', {playerName: p.name, score: p.score})
          );
          scoreHistory.current.pop();
          return {...p, score: p.score, bustFlag: true};
        }

        return {...p, score: newScore, bustFlag: false};
      }
      return p;
    });

    setPlayers(updatedPlayers);

    const updatedGameState: GameState = {
      ...gameState!,
      players: updatedPlayers,
    };

    setGameState(updatedGameState);
    await StorageService.saveGameState(updatedGameState as any);

    if (currentPreset!.mode === 'rounds') {
      await checkRoundCompletion(updatedPlayers);
    } else {
      await checkWinCondition(updatedPlayers);
    }
  };

  const undoLastScore = async (): Promise<void> => {
    if (scoreHistory.current.length === 0) return;

    const lastEntry = scoreHistory.current.pop()!;
    const updatedPlayers = players.map(p => {
      if (p.id === lastEntry.playerId) {
        return {...p, score: lastEntry.previousScore};
      }
      return p;
    });

    setPlayers(updatedPlayers);

    const updatedGameState: GameState = {
      ...gameState!,
      players: updatedPlayers,
    };

    setGameState(updatedGameState);
    await StorageService.saveGameState(updatedGameState as any);
  };

  const checkRoundCompletion = async (currentPlayers: Player[]): Promise<void> => {
    const preset = currentPreset as Extract<GamePreset, {mode: 'rounds'}>;

    const roundWinner = currentPlayers.find(p => p.score >= preset.roundTargetScore);

    if (roundWinner) {
      const updatedPlayers = currentPlayers.map(player => {
        const newRoundsHistory: Round[] = [...(player.rounds || []), {
          roundNumber: gameState!.currentRound!,
          score: player.score,
        }];

        return {
          ...player,
          rounds: newRoundsHistory,
          roundsWon: player.id === roundWinner.id ? (player.roundsWon! + 1) : player.roundsWon!,
          score: 0,
        };
      });

      const updatedGameState: GameState = {
        ...gameState!,
        players: updatedPlayers,
        currentRound: gameState!.currentRound! + 1,
      };

      setPlayers(updatedPlayers);
      setGameState(updatedGameState);
      await StorageService.saveGameState(updatedGameState as any);

      const maxRounds = preset.targetRounds * 3;
      const hasReachedMaxRounds = updatedGameState.currentRound! > maxRounds;

      if (hasReachedMaxRounds) {
        const maxRoundsWon = Math.max(...updatedPlayers.map(p => p.roundsWon!));
        const playersWithMaxRounds = updatedPlayers.filter(p => p.roundsWon === maxRoundsWon);

        if (playersWithMaxRounds.length === 1) {
          Alert.alert(
            t('game.roundLimitReached'),
            t('game.roundLimitWinner', {
              maxRounds,
              playerName: playersWithMaxRounds[0].name,
              roundsWon: maxRoundsWon,
            }),
            [{text: t('common.ok')}]
          );
          await endGame(playersWithMaxRounds[0]);
        } else {
          Alert.alert(
            t('game.draw'),
            t('game.roundLimitDraw', {
              maxRounds,
              players: playersWithMaxRounds.map(p => `${p.name} (${p.roundsWon} ${t('game.roundsWonShort')})`).join('\n'),
            }),
            [{text: t('common.ok')}]
          );
          await endGame(playersWithMaxRounds[0]);
        }
        return;
      }

      Alert.alert(
        t('game.roundCompleted', {round: gameState!.currentRound}),
        t('game.roundWinner', {
          playerName: roundWinner.name,
          score: roundWinner.score,
          standings: updatedPlayers.map(p => `${p.name}: ${p.roundsWon}`).join('\n'),
        }),
        [{text: t('game.continueButton')}]
      );

      await checkWinCondition(updatedPlayers);
    }
  };

  const checkWinCondition = async (currentPlayers: Player[]): Promise<void> => {
    const preset = currentPreset;

    if (!preset) return;

    let winner: Player | undefined = undefined;

    switch (preset.mode) {
      case 'max':
        winner = currentPlayers.find(p => p.score >= preset.targetScore);
        break;
      case 'min':
        const hasExceeded = currentPlayers.some(p => p.score >= preset.targetScore);
        if (hasExceeded) {
          const lowestScore = Math.min(...currentPlayers.map(p => p.score));
          const playersWithLowestScore = currentPlayers.filter(p => p.score === lowestScore);

          if (playersWithLowestScore.length === 1) {
            winner = playersWithLowestScore[0];
          } else {
            Alert.alert(
              t('game.draw'),
              t('game.drawMessage', {
                score: lowestScore,
                players: playersWithLowestScore.map(p => p.name).join(', '),
              }),
              [{text: t('common.ok')}]
            );
          }
        }
        break;
      case 'darts':
        winner = currentPlayers.find(p => p.score === 0);
        break;
      case 'rounds':
        const roundsPreset = preset as Extract<GamePreset, {mode: 'rounds'}>;
        winner = currentPlayers.find(p => p.roundsWon! >= roundsPreset.targetRounds);
        break;
    }

    if (winner) {
      await endGame(winner);
    }
  };

  const endGame = async (winner: Player): Promise<void> => {
    const finishedGame: GameState = {
      ...gameState!,
      isFinished: true,
      winner: winner.id,
      endTime: new Date().toISOString(),
    };

    setGameState(finishedGame);
    scoreHistory.current = [];
    await StorageService.saveGameState(finishedGame as any);
  };

  const saveGameToHistory = async (): Promise<boolean> => {
    if (!gameState || !gameState.isFinished) return false;

    if (gameState.isSaved) {
      Alert.alert(
        t('game.alreadySaved'),
        t('game.alreadySavedMessage')
      );
      return false;
    }

    try {
      await StorageService.addGameToHistory(gameState as any);
      const updatedHistory = await StorageService.loadGameHistory();
      setGameHistory(updatedHistory);

      const savedGameState: GameState = {
        ...gameState,
        isSaved: true,
      };
      setGameState(savedGameState);
      await StorageService.saveGameState(savedGameState as any);

      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving game to history:', error);
      }
      Alert.alert(t('common.error'), t('game.gameSaveError'));
      return false;
    }
  };

  const resetGame = async (): Promise<void> => {
    setGameState(null);
    setPlayers([]);
    setCurrentPreset(null);
    scoreHistory.current = [];
    await StorageService.clearGameState();
  };

  // ==================== HISTORY MANAGEMENT ====================

  const removeGameFromHistory = async (gameId: string): Promise<void> => {
    await StorageService.removeGameFromHistory(gameId);
    const updatedHistory = await StorageService.loadGameHistory();
    setGameHistory(updatedHistory);
  };

  const clearHistory = async (): Promise<void> => {
    await StorageService.clearGameHistory();
    setGameHistory([]);
  };

  // ==================== PRESET MANAGEMENT ====================

  const getAllPresets = (): GamePreset[] => {
    return [...DEFAULT_PRESETS, ...customPresets];
  };

  const addCustomPreset = async (preset: GamePreset): Promise<void> => {
    await StorageService.addPreset(preset as any);
    const updatedPresets = await StorageService.loadPresets();
    setCustomPresets(updatedPresets);
  };

  const removeCustomPreset = async (presetId: string): Promise<void> => {
    await StorageService.removePreset(presetId);
    const updatedPresets = await StorageService.loadPresets();
    setCustomPresets(updatedPresets);
  };

  const value: GameContextValue = {
    gameState,
    players,
    currentPreset,
    gameHistory,
    customPresets,
    isLoading,
    canUndo,

    startNewGame,
    updatePlayerScore,
    undoLastScore,
    endGame,
    saveGameToHistory,
    resetGame,

    removeGameFromHistory,
    clearHistory,

    getAllPresets,
    addCustomPreset,
    removeCustomPreset,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
