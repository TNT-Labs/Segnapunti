import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import PlayerCard from '../components/PlayerCard';
import ScoreModal from '../components/ScoreModal';
import AdBanner from '../components/AdBanner';

const GameScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {
    gameState,
    players,
    currentPreset,
    updatePlayerScore,
    resetGame,
    saveGameToHistory,
  } = useGame();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleAddScore = playerId => {
    const player = players.find(p => p.id === playerId);
    setSelectedPlayer(player);
    setModalVisible(true);
  };

  const handleSubtractScore = playerId => {
    const value = currentPreset?.incrementValues?.[0] || 10;
    updatePlayerScore(playerId, -value);
  };

  const handleScoreSubmit = score => {
    if (selectedPlayer) {
      updatePlayerScore(selectedPlayer.id, score);
    }
    setModalVisible(false);
    setSelectedPlayer(null);
  };

  const handleResetGame = () => {
    Alert.alert(
      'Ricomincia Partita',
      'Vuoi davvero ricominciare? I punteggi attuali verranno persi.',
      [
        {text: 'Annulla', style: 'cancel'},
        {
          text: 'Ricomincia',
          style: 'destructive',
          onPress: () => {
            resetGame();
            navigation.navigate('Settings');
          },
        },
      ],
    );
  };

  const handleSaveGame = () => {
    saveGameToHistory();
    Alert.alert('Partita Salvata', 'La partita è stata salvata nello storico!', [
      {text: 'OK', onPress: () => {
        resetGame();
        navigation.navigate('History');
      }},
    ]);
  };

  if (!gameState || !currentPreset) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎮</Text>
          <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>
            Nessuna Partita Attiva
          </Text>
          <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
            Vai in Impostazioni per iniziare una nuova partita!
          </Text>
          <TouchableOpacity
            style={[styles.startButton, {backgroundColor: theme.colors.primary}]}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.startButtonText}>Inizia Partita</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const winner = gameState.isFinished ? players.find(p => p.id === gameState.winner) : null;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={[styles.header, {backgroundColor: theme.colors.card}]}>
          <Text style={[styles.presetName, {color: theme.colors.primary}]}>
            {currentPreset.icon} {currentPreset.name}
          </Text>
          <Text style={[styles.gameInfo, {color: theme.colors.textSecondary}]}>
            {currentPreset.mode === 'rounds'
              ? `${currentPreset.targetRounds} rounds - Target: ${currentPreset.roundTargetScore}`
              : `Target: ${currentPreset.targetScore}`}
          </Text>
        </View>

        {winner && (
          <View style={[styles.winnerBanner, {backgroundColor: theme.colors.success}]}>
            <Text style={styles.winnerText}>🏆 {winner.name} ha vinto! 🏆</Text>
          </View>
        )}

        <View style={styles.playersList}>
          {players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              onAddScore={handleAddScore}
              onSubtractScore={handleSubtractScore}
              showActions={!gameState.isFinished}
            />
          ))}
        </View>

        <AdBanner size="small" style={styles.adBanner} />

        {gameState.isFinished ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, {backgroundColor: theme.colors.primary}]}
              onPress={handleSaveGame}>
              <Text style={styles.actionButtonText}>💾 Salva Partita</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, {backgroundColor: theme.colors.textSecondary}]}
              onPress={handleResetGame}>
              <Text style={styles.actionButtonText}>🔄 Nuova Partita</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.resetButton, {backgroundColor: theme.colors.error}]}
            onPress={handleResetGame}>
            <Text style={styles.resetButtonText}>🔄 Ricomincia Partita</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ScoreModal
        visible={modalVisible}
        onClose={() => {setModalVisible(false); setSelectedPlayer(null);}}
        onSubmit={handleScoreSubmit}
        playerName={selectedPlayer?.name}
        incrementValues={currentPreset?.incrementValues}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  scrollView: {flex: 1},
  content: {padding: 16, paddingBottom: 32},
  emptyState: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32},
  emptyIcon: {fontSize: 64, marginBottom: 16},
  emptyTitle: {fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center'},
  emptySubtitle: {fontSize: 16, textAlign: 'center', marginBottom: 24},
  startButton: {paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8},
  startButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  header: {padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4},
  presetName: {fontSize: 22, fontWeight: 'bold', marginBottom: 4},
  gameInfo: {fontSize: 14},
  winnerBanner: {padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center'},
  winnerText: {color: '#FFFFFF', fontSize: 18, fontWeight: 'bold'},
  playersList: {marginBottom: 8},
  adBanner: {marginBottom: 16},
  actions: {gap: 12},
  actionButton: {paddingVertical: 14, borderRadius: 8, alignItems: 'center'},
  actionButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  resetButton: {paddingVertical: 14, borderRadius: 8, alignItems: 'center'},
  resetButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
});

export default GameScreen;
