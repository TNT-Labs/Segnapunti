import React, {createContext, useState, useEffect, useContext} from 'react';
import StorageService from '../services/StorageService';
import {DEFAULT_PRESETS} from '../constants/presets';

const GameContext = createContext();

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
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== GAME MANAGEMENT ====================

  const startNewGame = async (preset, playerNames) => {
    const newPlayers = playerNames.map((name, index) => ({
      id: `player_${index}_${Date.now()}`,
      name,
      score: preset.mode === 'darts' ? preset.targetScore : 0,
      rounds: preset.mode === 'rounds' ? [] : undefined,
      roundsWon: preset.mode === 'rounds' ? 0 : undefined,
    }));

    const newGameState = {
      preset,
      players: newPlayers,
      startTime: new Date().toISOString(),
      isFinished: false,
      winner: null,
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
          return player; // BUST! Mantieni score precedente
        }

        return {...player, score: newScore};
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

    // Controlla condizione vittoria
    checkWinCondition(updatedPlayers);
  };

  const checkWinCondition = (currentPlayers) => {
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
      endGame(winner);
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
    if (!gameState || !gameState.isFinished) return;

    await StorageService.addGameToHistory(gameState);
    const updatedHistory = await StorageService.loadGameHistory();
    setGameHistory(updatedHistory);
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
