import React, {createContext, useState, useEffect, useContext} from 'react';
import {Alert} from 'react-native';
import StorageService from '../services/StorageService';
import {DEFAULT_PRESETS} from '../constants/presets';

const GameContext = createContext();

// Generatore di ID univoci
let idCounter = 0;
const generateUniqueId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${++idCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

export const GameProvider = ({children}) => {
  // Game state
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPreset, setCurrentPreset] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [customPresets, setCustomPresets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carica dati al mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // Carica stato partita
      const savedGame = await StorageService.loadGameState();
      if (savedGame) {
        setGameState(savedGame);
        setPlayers(savedGame.players || []);
        setCurrentPreset(savedGame.preset || null);
      }

      // Carica storico
      const history = await StorageService.loadGameHistory();
      setGameHistory(history);

      // Carica preset personalizzati
      const presets = await StorageService.loadPresets();
      setCustomPresets(presets);

    } catch (error) {
      console.error('Error loading game data:', error);
      Alert.alert(
        'Errore Caricamento',
        'Impossibile caricare i dati salvati. I dati potrebbero essere corrotti.',
        [{text: 'OK'}]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== GAME MANAGEMENT ====================

  const startNewGame = async (preset, playerNames) => {
    const newPlayers = playerNames.map((name, index) => ({
      id: generateUniqueId('player'),
      name,
      score: preset.mode === 'darts' ? preset.targetScore : 0,
      rounds: preset.mode === 'rounds' ? [] : undefined,
      roundsWon: preset.mode === 'rounds' ? 0 : undefined,
      bustFlag: false,
    }));

    const newGameState = {
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
    await StorageService.saveGameState(newGameState);
  };

  const updatePlayerScore = async (playerId, scoreChange) => {
    const updatedPlayers = players.map(player => {
      if (player.id === playerId) {
        let newScore = player.score + scoreChange;

        // Gestione modalità darts (non può andare sotto 0)
        if (currentPreset.mode === 'darts' && newScore < 0) {
          Alert.alert('BUST!', `${player.name} è andato sotto zero! Il punteggio rimane ${player.score}.`);
          return {...player, bustFlag: true};
        }

        return {...player, score: newScore, bustFlag: false};
      }
      return player;
    });

    setPlayers(updatedPlayers);

    const updatedGameState = {
      ...gameState,
      players: updatedPlayers,
    };

    setGameState(updatedGameState);
    await StorageService.saveGameState(updatedGameState);

    // Per modalità rounds, controlla se qualcuno ha vinto il round
    if (currentPreset.mode === 'rounds') {
      await checkRoundCompletion(updatedPlayers);
    } else {
      // Controlla condizione vittoria per altre modalità
      await checkWinCondition(updatedPlayers);
    }
  };

  // Controlla se un round è stato completato (modalità rounds)
  const checkRoundCompletion = async (currentPlayers) => {
    const preset = currentPreset;

    // Trova il vincitore del round
    const roundWinner = currentPlayers.find(p => p.score >= preset.roundTargetScore);

    if (roundWinner) {
      // Salva i punteggi del round per tutti i giocatori
      const updatedPlayers = currentPlayers.map(player => {
        const newRoundsHistory = [...(player.rounds || []), {
          roundNumber: gameState.currentRound,
          score: player.score,
        }];

        return {
          ...player,
          rounds: newRoundsHistory,
          roundsWon: player.id === roundWinner.id ? (player.roundsWon + 1) : player.roundsWon,
          score: 0, // Reset score per il prossimo round
        };
      });

      const updatedGameState = {
        ...gameState,
        players: updatedPlayers,
        currentRound: gameState.currentRound + 1,
      };

      setPlayers(updatedPlayers);
      setGameState(updatedGameState);
      await StorageService.saveGameState(updatedGameState);

      // Notifica il vincitore del round
      Alert.alert(
        `Round ${gameState.currentRound} Completato!`,
        `🏆 ${roundWinner.name} ha vinto il round con ${roundWinner.score} punti!\n\nRounds vinti:\n${updatedPlayers.map(p => `${p.name}: ${p.roundsWon}`).join('\n')}`,
        [{text: 'Continua'}]
      );

      // Controlla se qualcuno ha vinto la partita
      await checkWinCondition(updatedPlayers);
    }
  };

  const checkWinCondition = async (currentPlayers) => {
    const preset = currentPreset;

    if (!preset) return;

    let winner = null;

    switch (preset.mode) {
      case 'max':
        winner = currentPlayers.find(p => p.score >= preset.targetScore);
        break;
      case 'min':
        winner = currentPlayers.find(p => p.score >= preset.targetScore);
        break;
      case 'darts':
        winner = currentPlayers.find(p => p.score === 0);
        break;
      case 'rounds':
        winner = currentPlayers.find(p => p.roundsWon >= preset.targetRounds);
        break;
    }

    if (winner) {
      await endGame(winner);
    }
  };

  const endGame = async (winner) => {
    const finishedGame = {
      ...gameState,
      isFinished: true,
      winner: winner.id,
      endTime: new Date().toISOString(),
    };

    setGameState(finishedGame);
    await StorageService.saveGameState(finishedGame);
  };

  const saveGameToHistory = async () => {
    if (!gameState || !gameState.isFinished) return false;

    // Previeni duplicati controllando se questa partita è già stata salvata
    if (gameState.isSaved) {
      Alert.alert('Già Salvata', 'Questa partita è già stata salvata nello storico!');
      return false;
    }

    try {
      await StorageService.addGameToHistory(gameState);
      const updatedHistory = await StorageService.loadGameHistory();
      setGameHistory(updatedHistory);

      // Marca la partita come salvata
      const savedGameState = {
        ...gameState,
        isSaved: true,
      };
      setGameState(savedGameState);
      await StorageService.saveGameState(savedGameState);

      return true;
    } catch (error) {
      console.error('Error saving game to history:', error);
      Alert.alert('Errore', 'Impossibile salvare la partita nello storico.');
      return false;
    }
  };

  const resetGame = async () => {
    setGameState(null);
    setPlayers([]);
    setCurrentPreset(null);
    await StorageService.clearGameState();
  };

  // ==================== HISTORY MANAGEMENT ====================

  const removeGameFromHistory = async (gameId) => {
    await StorageService.removeGameFromHistory(gameId);
    const updatedHistory = await StorageService.loadGameHistory();
    setGameHistory(updatedHistory);
  };

  const clearHistory = async () => {
    await StorageService.clearGameHistory();
    setGameHistory([]);
  };

  // ==================== PRESET MANAGEMENT ====================

  const getAllPresets = () => {
    return [...DEFAULT_PRESETS, ...customPresets];
  };

  const addCustomPreset = async (preset) => {
    await StorageService.addPreset(preset);
    const updatedPresets = await StorageService.loadPresets();
    setCustomPresets(updatedPresets);
  };

  const removeCustomPreset = async (presetId) => {
    await StorageService.removePreset(presetId);
    const updatedPresets = await StorageService.loadPresets();
    setCustomPresets(updatedPresets);
  };

  const value = {
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

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
