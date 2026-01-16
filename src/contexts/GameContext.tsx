import React, {createContext, useState, useEffect, useContext, ReactNode} from 'react';
import {Alert} from 'react-native';
import StorageService from '../services/StorageService';
import {DEFAULT_PRESETS} from '../constants/presets';
import {GamePreset} from '../constants/presets';

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

interface GameContextValue {
  // State
  gameState: GameState | null;
  players: Player[];
  currentPreset: GamePreset | null;
  gameHistory: any[];
  customPresets: GamePreset[];
  isLoading: boolean;

  // Game actions
  startNewGame: (preset: GamePreset, playerNames: string[]) => Promise<void>;
  updatePlayerScore: (playerId: string, scoreChange: number) => Promise<void>;
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

// Generatore di ID univoci
const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

export const GameProvider: React.FC<GameProviderProps> = ({children}) => {
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPreset, setCurrentPreset] = useState<GamePreset | null>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [customPresets, setCustomPresets] = useState<GamePreset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carica dati al mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);

        // Carica stato partita
        const savedGame = await StorageService.loadGameState();
        if (savedGame) {
          setGameState(savedGame as any);
          setPlayers((savedGame.players as any) || []);
          setCurrentPreset(savedGame.preset || null);
        }

        // Carica storico
        const history = await StorageService.loadGameHistory();
        setGameHistory(history);

        // Carica preset personalizzati
        const presets = await StorageService.loadPresets();
        setCustomPresets(presets);

      } catch (error) {
        if (__DEV__) {
          console.error('Error loading game data:', error);
        }
        Alert.alert(
          'Errore Caricamento',
          'Impossibile caricare i dati salvati. I dati potrebbero essere corrotti.',
          [{text: 'OK'}]
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

    setGameState(newGameState);
    setPlayers(newPlayers);
    setCurrentPreset(preset);
    await StorageService.saveGameState(newGameState as any);
  };

  const updatePlayerScore = async (playerId: string, scoreChange: number): Promise<void> => {
    const updatedPlayers = players.map(player => {
      if (player.id === playerId) {
        let newScore = player.score + scoreChange;

        // Gestione modalità darts (non può andare sotto 0)
        if (currentPreset!.mode === 'darts' && newScore < 0) {
          Alert.alert('BUST!', `${player.name} è andato sotto zero! Il punteggio rimane ${player.score}.`);
          return {...player, score: player.score, bustFlag: true};
        }

        return {...player, score: newScore, bustFlag: false};
      }
      return player;
    });

    setPlayers(updatedPlayers);

    const updatedGameState: GameState = {
      ...gameState!,
      players: updatedPlayers,
    };

    setGameState(updatedGameState);
    await StorageService.saveGameState(updatedGameState as any);

    // Per modalità rounds, controlla se qualcuno ha vinto il round
    if (currentPreset!.mode === 'rounds') {
      await checkRoundCompletion(updatedPlayers);
    } else {
      // Controlla condizione vittoria per altre modalità
      await checkWinCondition(updatedPlayers);
    }
  };

  // Controlla se un round è stato completato (modalità rounds)
  const checkRoundCompletion = async (currentPlayers: Player[]): Promise<void> => {
    const preset = currentPreset as Extract<GamePreset, {mode: 'rounds'}>;

    // Trova il vincitore del round
    const roundWinner = currentPlayers.find(p => p.score >= preset.roundTargetScore);

    if (roundWinner) {
      // Salva i punteggi del round per tutti i giocatori
      const updatedPlayers = currentPlayers.map(player => {
        const newRoundsHistory: Round[] = [...(player.rounds || []), {
          roundNumber: gameState!.currentRound!,
          score: player.score,
        }];

        return {
          ...player,
          rounds: newRoundsHistory,
          roundsWon: player.id === roundWinner.id ? (player.roundsWon! + 1) : player.roundsWon!,
          score: 0, // Reset score per il prossimo round
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

      // Controlla se è stato raggiunto il limite massimo di round
      const maxRounds = preset.targetRounds * 3; // Limite: 3x i round target
      const hasReachedMaxRounds = updatedGameState.currentRound! > maxRounds;

      if (hasReachedMaxRounds) {
        // Termina la partita per timeout, vince chi ha più round
        const maxRoundsWon = Math.max(...updatedPlayers.map(p => p.roundsWon!));
        const playersWithMaxRounds = updatedPlayers.filter(p => p.roundsWon === maxRoundsWon);

        if (playersWithMaxRounds.length === 1) {
          // Un vincitore chiaro
          Alert.alert(
            'Limite Round Raggiunto!',
            `La partita ha raggiunto il limite massimo di ${maxRounds} round.\n\n🏆 ${playersWithMaxRounds[0].name} vince con ${maxRoundsWon} round vinti!`,
            [{text: 'OK'}]
          );
          await endGame(playersWithMaxRounds[0]);
        } else {
          // Pareggio
          Alert.alert(
            'Pareggio!',
            `La partita ha raggiunto il limite massimo di ${maxRounds} round.\n\nPareggio tra:\n${playersWithMaxRounds.map(p => `${p.name} (${p.roundsWon} round)`).join('\n')}`,
            [{text: 'OK'}]
          );
          // Termina comunque la partita con il primo giocatore in pareggio come "vincitore"
          await endGame(playersWithMaxRounds[0]);
        }
        return;
      }

      // Notifica il vincitore del round
      Alert.alert(
        `Round ${gameState!.currentRound} Completato!`,
        `🏆 ${roundWinner.name} ha vinto il round con ${roundWinner.score} punti!\n\nRounds vinti:\n${updatedPlayers.map(p => `${p.name}: ${p.roundsWon}`).join('\n')}`,
        [{text: 'Continua'}]
      );

      // Controlla se qualcuno ha vinto la partita
      await checkWinCondition(updatedPlayers);
    }
  };

  const checkWinCondition = async (currentPlayers: Player[]): Promise<void> => {
    const preset = currentPreset;

    if (!preset) return;

    let winner: Player | undefined = undefined;

    switch (preset.mode) {
      case 'max':
        // Vince chi raggiunge per primo il punteggio target
        winner = currentPlayers.find(p => p.score >= preset.targetScore);
        break;
      case 'min':
        // Quando qualcuno supera il target, vince chi ha il punteggio PIÙ BASSO
        const hasExceeded = currentPlayers.some(p => p.score >= preset.targetScore);
        if (hasExceeded) {
          // Trova il punteggio più basso
          const lowestScore = Math.min(...currentPlayers.map(p => p.score));
          // Trova tutti i giocatori con quel punteggio
          const playersWithLowestScore = currentPlayers.filter(p => p.score === lowestScore);

          // Se c'è un solo giocatore con il punteggio più basso, ha vinto
          if (playersWithLowestScore.length === 1) {
            winner = playersWithLowestScore[0];
          } else {
            // Pareggio: mostra alert e continua a giocare
            Alert.alert(
              'Pareggio!',
              `Più giocatori hanno il punteggio più basso (${lowestScore}). Continuate a giocare per determinare il vincitore!\n\n${playersWithLowestScore.map(p => p.name).join(', ')}`,
              [{text: 'OK'}]
            );
          }
        }
        break;
      case 'darts':
        // Vince chi arriva esattamente a 0
        winner = currentPlayers.find(p => p.score === 0);
        break;
      case 'rounds':
        // Vince chi raggiunge per primo il numero di round target
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
    await StorageService.saveGameState(finishedGame as any);
  };

  const saveGameToHistory = async (): Promise<boolean> => {
    if (!gameState || !gameState.isFinished) return false;

    // Previeni duplicati controllando se questa partita è già stata salvata
    if (gameState.isSaved) {
      Alert.alert('Già Salvata', 'Questa partita è già stata salvata nello storico!');
      return false;
    }

    try {
      await StorageService.addGameToHistory(gameState as any);
      const updatedHistory = await StorageService.loadGameHistory();
      setGameHistory(updatedHistory);

      // Marca la partita come salvata
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
      Alert.alert('Errore', 'Impossibile salvare la partita nello storico.');
      return false;
    }
  };

  const resetGame = async (): Promise<void> => {
    setGameState(null);
    setPlayers([]);
    setCurrentPreset(null);
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
    // State
    gameState,
    players,
    currentPreset,
    gameHistory,
    customPresets,
    isLoading,

    // Game actions
    startNewGame,
    updatePlayerScore,
    endGame,
    saveGameToHistory,
    resetGame,

    // History actions
    removeGameFromHistory,
    clearHistory,

    // Preset actions
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
