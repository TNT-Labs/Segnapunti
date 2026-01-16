import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import PlayerCard from '../components/PlayerCard';
import ScoreModal from '../components/ScoreModal';
import AdBanner from '../components/AdBanner';
import {AD_UNITS, AD_BANNER_SIZES} from '../config/adConfig';
import type {GameScreenProps} from '../navigation/AppNavigator';

interface Player {
  id: string;
  name: string;
  score: number;
  rounds?: Array<{roundNumber: number; score: number}>;
  roundsWon?: number;
  bustFlag: boolean;
}

const GameScreen: React.FC<GameScreenProps> = ({navigation}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {
    gameState,
    players,
    currentPreset,
    updatePlayerScore,
    resetGame,
    saveGameToHistory,
  } = useGame();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handleAddScore = (playerId: string): void => {
    const player = players.find(p => p.id === playerId);
    setSelectedPlayer(player || null);
    setModalVisible(true);
  };

  const handleSubtractScore = (playerId: string): void => {
    const value = currentPreset?.incrementValues?.[0] || 10;
    updatePlayerScore(playerId, -value);
  };

  const handleScoreSubmit = (score: number): void => {
    if (selectedPlayer) {
      updatePlayerScore(selectedPlayer.id, score);
    }
    setModalVisible(false);
    setSelectedPlayer(null);
  };

  const handleResetGame = (): void => {
    Alert.alert(
      t('game.resetConfirm'),
      t('game.resetConfirmMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('game.reset'),
          style: 'destructive',
          onPress: () => {
            resetGame();
            navigation.navigate('Settings');
          },
        },
      ],
    );
  };

  const handleSaveGame = async (): Promise<void> => {
    const success = await saveGameToHistory();

    if (success) {
      Alert.alert(t('game.gameOver'), t('game.gameSaved'), [
        {text: t('common.ok'), onPress: () => {
          resetGame();
          navigation.navigate('History');
        }},
      ]);
    } else {
      Alert.alert(
        t('common.error'),
        t('game.gameSaveError'),
        [{text: t('common.ok')}]
      );
    }
  };

  if (!gameState || !currentPreset) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.emptyState}>
          <Text
            style={styles.emptyIcon}
            accessibilityLabel="🎮"
            accessibilityRole="image">
            🎮
          </Text>
          <Text
            style={[styles.emptyTitle, {color: theme.colors.text}]}
            accessibilityRole="header">
            {t('game.noGame')}
          </Text>
          <Text
            style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}
            accessibilityRole="text">
            {t('game.noGameMessage')}
          </Text>
          <TouchableOpacity
            accessible={true}
            accessibilityLabel={t('game.goToSettings')}
            accessibilityHint={t('game.noGameMessage')}
            accessibilityRole="button"
            style={[styles.startButton, {backgroundColor: theme.colors.primary}]}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.startButtonText}>{t('game.goToSettings')}</Text>
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
          <Text
            style={[styles.presetName, {color: theme.colors.primary}]}
            accessibilityRole="header"
            accessibilityLabel={t('game.matchTo', {gameName: currentPreset.name})}>
            {currentPreset.icon} {currentPreset.name}
          </Text>
          <Text
            style={[styles.gameInfo, {color: theme.colors.textSecondary}]}
            accessibilityRole="text"
            accessibilityLabel={currentPreset.mode === 'rounds'
              ? t('game.roundsDescription', {rounds: currentPreset.targetRounds, target: currentPreset.roundTargetScore})
              : t('game.targetDescription', {target: currentPreset.targetScore})}>
            {currentPreset.mode === 'rounds'
              ? t('game.roundsInfo', {rounds: currentPreset.targetRounds, target: currentPreset.roundTargetScore})
              : t('game.targetInfo', {target: currentPreset.targetScore})}
          </Text>
        </View>

        {winner && (
          <View
            style={[styles.winnerBanner, {backgroundColor: theme.colors.success}]}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel={t('game.winnerAnnouncement', {playerName: winner.name})}
            accessibilityLiveRegion="polite">
            <Text style={styles.winnerText}>{t('game.winnerBanner', {playerName: winner.name})}</Text>
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

        <AdBanner
          size={AD_BANNER_SIZES.GAME_SCREEN}
          style={styles.adBanner}
          adUnitId={AD_UNITS.GAME_SCREEN}
        />

        {gameState.isFinished ? (
          <View style={styles.actions}>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('game.saveGameLabel')}
              accessibilityHint={t('game.saveGameHint')}
              accessibilityRole="button"
              style={[styles.actionButton, {backgroundColor: theme.colors.primary}]}
              onPress={handleSaveGame}>
              <Text style={styles.actionButtonText}>{t('game.saveGame')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('game.startNewGameLabel')}
              accessibilityHint={t('game.startNewGameHint')}
              accessibilityRole="button"
              style={[styles.actionButton, {backgroundColor: theme.colors.textSecondary}]}
              onPress={handleResetGame}>
              <Text style={styles.actionButtonText}>{t('game.startNewGame')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            accessible={true}
            accessibilityLabel={t('game.restartGameLabel')}
            accessibilityHint={t('game.restartGameHint')}
            accessibilityRole="button"
            style={[styles.resetButton, {backgroundColor: theme.colors.error}]}
            onPress={handleResetGame}>
            <Text style={styles.resetButtonText}>{t('game.restartGame')}</Text>
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
