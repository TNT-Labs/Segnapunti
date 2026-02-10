import React, {useState, useMemo} from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
    undoLastScore,
    canUndo,
    resetGame,
    saveGameToHistory,
  } = useGame();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Sort players by ranking
  const rankedPlayers = useMemo(() => {
    if (!currentPreset || !players.length) return players;

    const sorted = [...players];
    switch (currentPreset.mode) {
      case 'max':
        sorted.sort((a, b) => b.score - a.score);
        break;
      case 'min':
        sorted.sort((a, b) => a.score - b.score);
        break;
      case 'darts':
        sorted.sort((a, b) => a.score - b.score);
        break;
      case 'rounds':
        sorted.sort((a, b) => (b.roundsWon || 0) - (a.roundsWon || 0) || b.score - a.score);
        break;
    }
    return sorted;
  }, [players, currentPreset]);

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
          <Icon
            name="cards-playing-outline"
            size={80}
            color={theme.colors.textSecondary}
            style={styles.emptyIcon}
          />
          <Text
            style={[styles.emptyTitle, {color: theme.colors.text}]}
            accessibilityRole="header">
            {t('game.noGame')}
          </Text>
          <Text
            style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
            {t('game.noGameMessage')}
          </Text>
          <TouchableOpacity
            accessible={true}
            accessibilityLabel={t('game.goToSettings')}
            accessibilityRole="button"
            style={[styles.startButton, {backgroundColor: theme.colors.primary}]}
            onPress={() => navigation.navigate('Settings')}>
            <Icon name="plus-circle" size={20} color="#FFFFFF" style={{marginRight: 8}} />
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
          <View style={styles.headerTop}>
            <Text
              style={[styles.presetName, {color: theme.colors.primary}]}
              accessibilityRole="header"
              accessibilityLabel={t('game.matchTo', {gameName: currentPreset.name})}>
              {currentPreset.icon} {currentPreset.name}
            </Text>
            {!gameState.isFinished && canUndo && (
              <TouchableOpacity
                accessible={true}
                accessibilityLabel={t('game.undo')}
                accessibilityHint={t('game.undoHint')}
                accessibilityRole="button"
                style={[styles.undoButton, {backgroundColor: theme.colors.warning}]}
                onPress={undoLastScore}>
                <Icon name="undo" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text
            style={[styles.gameInfo, {color: theme.colors.textSecondary}]}>
            {currentPreset.mode === 'rounds'
              ? t('game.roundsInfo', {rounds: currentPreset.targetRounds, target: currentPreset.roundTargetScore})
              : t('game.targetInfo', {target: currentPreset.targetScore})}
          </Text>
          {currentPreset.mode === 'rounds' && gameState.currentRound && (
            <View style={[styles.roundBadge, {backgroundColor: theme.colors.primary + '20'}]}>
              <Text style={[styles.roundBadgeText, {color: theme.colors.primary}]}>
                {t('game.currentRound', {round: gameState.currentRound})}
              </Text>
            </View>
          )}
        </View>

        {winner && (
          <View
            style={[styles.winnerBanner, {backgroundColor: theme.colors.success}]}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel={t('game.winnerAnnouncement', {playerName: winner.name})}
            accessibilityLiveRegion="polite">
            <Icon name="trophy" size={24} color="#FFFFFF" style={{marginRight: 8}} />
            <Text style={styles.winnerText}>{t('game.winnerBanner', {playerName: winner.name})}</Text>
          </View>
        )}

        <View style={styles.playersList}>
          {rankedPlayers.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              position={index + 1}
              isLeading={index === 0 && !gameState.isFinished && players.length > 1}
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
              <Icon name="content-save" size={20} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.actionButtonText}>{t('game.saveGame')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('game.startNewGameLabel')}
              accessibilityHint={t('game.startNewGameHint')}
              accessibilityRole="button"
              style={[styles.secondaryButton, {backgroundColor: theme.colors.card, borderColor: theme.colors.primary}]}
              onPress={handleResetGame}>
              <Icon name="plus-circle" size={20} color={theme.colors.primary} style={{marginRight: 8}} />
              <Text style={[styles.secondaryButtonText, {color: theme.colors.primary}]}>{t('game.startNewGame')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resetContainer}>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('game.restartGameLabel')}
              accessibilityHint={t('game.restartGameHint')}
              accessibilityRole="button"
              style={[styles.resetButton, {borderColor: theme.colors.error}]}
              onPress={handleResetGame}>
              <Icon name="restart" size={16} color={theme.colors.error} style={{marginRight: 6}} />
              <Text style={[styles.resetButtonText, {color: theme.colors.error}]}>{t('game.restartGame')}</Text>
            </TouchableOpacity>
          </View>
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
  emptyIcon: {marginBottom: 20},
  emptyTitle: {fontSize: 24, fontWeight: 'bold', marginBottom: 8, textAlign: 'center'},
  emptySubtitle: {fontSize: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22},
  startButton: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, elevation: 3},
  startButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  header: {padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4},
  headerTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  presetName: {fontSize: 22, fontWeight: 'bold', marginBottom: 4, flex: 1},
  gameInfo: {fontSize: 14, marginTop: 2},
  undoButton: {width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2},
  roundBadge: {marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start'},
  roundBadgeText: {fontSize: 13, fontWeight: '600'},
  winnerBanner: {flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center', justifyContent: 'center', elevation: 3},
  winnerText: {color: '#FFFFFF', fontSize: 18, fontWeight: 'bold'},
  playersList: {marginBottom: 8},
  adBanner: {marginBottom: 16},
  actions: {gap: 12},
  actionButton: {flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2},
  actionButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  secondaryButton: {flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2},
  secondaryButtonText: {fontSize: 16, fontWeight: '600'},
  resetContainer: {alignItems: 'center', marginTop: 8},
  resetButton: {flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', borderWidth: 1},
  resetButtonText: {fontSize: 14, fontWeight: '500'},
});

export default GameScreen;
