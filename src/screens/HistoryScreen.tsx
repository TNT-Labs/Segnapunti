import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ListRenderItem} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AdBanner from '../components/AdBanner';
import {AD_UNITS, AD_BANNER_SIZES} from '../config/adConfig';
import type {HistoryScreenProps} from '../navigation/AppNavigator';
import type {GamePreset} from '../constants/presets';

interface Player {
  id: string;
  name: string;
  score: number;
  rounds?: Array<{roundNumber: number; score: number}>;
  roundsWon?: number;
  bustFlag: boolean;
}

interface HistoricalGame {
  id: string;
  preset: GamePreset;
  players: Player[];
  winner: string | null;
  timestamp: string;
  startTime: string;
  endTime?: string;
}

const HistoryScreen: React.FC<HistoryScreenProps> = () => {
  const {t, i18n} = useTranslation();
  const {theme} = useTheme();
  const {gameHistory, removeGameFromHistory, clearHistory} = useGame();

  const handleDeleteGame = (gameId: string): void => {
    Alert.alert(
      t('history.deleteGame'),
      t('history.deleteGameMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {text: t('common.delete'), style: 'destructive', onPress: () => removeGameFromHistory(gameId)},
      ],
    );
  };

  const handleClearAll = (): void => {
    Alert.alert(
      t('history.clearConfirm'),
      t('history.clearConfirmMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {text: t('history.clearConfirm'), style: 'destructive', onPress: clearHistory},
      ],
    );
  };

  const renderGame: ListRenderItem<HistoricalGame> = ({item}) => {
    const winner = item.players.find(p => p.id === item.winner);
    const date = new Date(item.timestamp);
    const locale = i18n.language || 'it';

    return (
      <View
        style={[styles.gameCard, {backgroundColor: theme.colors.card}]}
        accessible={true}
        accessibilityLabel={t('history.gameAccessibilityLabel', {
          gameName: item.preset.name,
          date: date.toLocaleDateString(locale),
          winnerText: winner ? t('history.gameWonBy', {playerName: winner.name}) : ''
        })}>
        <View style={styles.gameHeader}>
          <Text
            style={[styles.gameName, {color: theme.colors.text}]}
            accessibilityRole="header">
            {item.preset.icon} {item.preset.name}
          </Text>
          <TouchableOpacity
            accessible={true}
            accessibilityLabel={t('history.gameCard.deleteGame')}
            accessibilityHint={t('history.gameCard.deleteGameHint')}
            accessibilityRole="button"
            onPress={() => handleDeleteGame(item.id)}>
            <Icon name="delete" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.gameDate, {color: theme.colors.textSecondary}]}
          accessibilityRole="text">
          {date.toLocaleDateString(locale)} {date.toLocaleTimeString(locale, {hour: '2-digit', minute: '2-digit'})}
        </Text>

        {winner ? (
          <Text
            style={[styles.winner, {color: theme.colors.success}]}
            accessibilityRole="text"
            accessibilityLabel={t('history.winnerLabel', {playerName: winner.name})}>
            {t('history.gameCard.winner')}: {winner.name}
          </Text>
        ) : (
          <Text style={[styles.noWinner, {color: theme.colors.warning}]}>
            {t('history.incompleteGame')}
          </Text>
        )}

        <View style={styles.players}>
          {item.players.map(player => (
            <View key={player.id} style={styles.playerRow}>
              <Text
                style={[styles.playerName, {color: theme.colors.text}]}
                accessibilityRole="text">
                {player.name}
              </Text>
              <Text
                style={[styles.playerScore, {color: theme.colors.textSecondary}]}
                accessibilityRole="text"
                accessibilityLabel={t('history.scoreLabel', {score: player.score})}>
                {player.score}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (gameHistory.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.emptyState}>
          <Icon
            name="history"
            size={64}
            color={theme.colors.textSecondary}
            style={styles.emptyIcon}
            accessibilityLabel={t('history.emptyIcon')}
          />
          <Text
            style={[styles.emptyTitle, {color: theme.colors.text}]}
            accessibilityRole="header">
            {t('history.noGames')}
          </Text>
          <Text
            style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}
            accessibilityRole="text">
            {t('history.noGamesMessage')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={gameHistory as HistoricalGame[]}
        renderItem={renderGame}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <AdBanner
              size={AD_BANNER_SIZES.HISTORY_SCREEN}
              style={styles.adBanner}
              adUnitId={AD_UNITS.HISTORY_SCREEN}
            />
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('history.clearAllLabel')}
              accessibilityHint={t('history.clearAllHint', {count: gameHistory.length})}
              accessibilityRole="button"
              style={[styles.clearButton, {backgroundColor: theme.colors.error}]}
              onPress={handleClearAll}>
              <Icon name="delete-sweep" size={20} color="#FFFFFF" style={styles.clearButtonIcon} />
              <Text style={styles.clearButtonText}>{t('history.clearAllButton')}</Text>
            </TouchableOpacity>
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  list: {padding: 16, paddingBottom: 32},
  emptyState: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32},
  emptyIcon: {marginBottom: 16},
  emptyTitle: {fontSize: 24, fontWeight: 'bold', marginBottom: 8},
  emptySubtitle: {fontSize: 16, textAlign: 'center'},
  clearButton: {flexDirection: 'row', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8, gap: 8},
  clearButtonIcon: {marginRight: 4},
  clearButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '600'},
  adBanner: {marginBottom: 16},
  gameCard: {padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4},
  gameHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  gameName: {fontSize: 18, fontWeight: 'bold', flex: 1},
  gameDate: {fontSize: 12, marginBottom: 8},
  winner: {fontSize: 14, fontWeight: '600', marginBottom: 12},
  noWinner: {fontSize: 14, fontWeight: '600', marginBottom: 12, fontStyle: 'italic'},
  players: {gap: 6},
  playerRow: {flexDirection: 'row', justifyContent: 'space-between'},
  playerName: {fontSize: 14},
  playerScore: {fontSize: 14, fontWeight: '500'},
});

export default HistoryScreen;
