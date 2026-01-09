import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Alert} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AdBanner from '../components/AdBanner';

const HistoryScreen = () => {
  const {theme} = useTheme();
  const {gameHistory, removeGameFromHistory, clearHistory} = useGame();

  const handleDeleteGame = gameId => {
    Alert.alert(
      'Elimina Partita',
      'Vuoi davvero eliminare questa partita dallo storico?',
      [
        {text: 'Annulla', style: 'cancel'},
        {text: 'Elimina', style: 'destructive', onPress: () => removeGameFromHistory(gameId)},
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Elimina Tutto',
      'Vuoi davvero eliminare tutto lo storico? Questa azione non può essere annullata.',
      [
        {text: 'Annulla', style: 'cancel'},
        {text: 'Elimina Tutto', style: 'destructive', onPress: clearHistory},
      ],
    );
  };

  const renderGame = ({item}) => {
    const winner = item.players.find(p => p.id === item.winner);
    const date = new Date(item.timestamp);

    return (
      <View style={[styles.gameCard, {backgroundColor: theme.colors.card}]}>
        <View style={styles.gameHeader}>
          <Text style={[styles.gameName, {color: theme.colors.text}]}>
            {item.preset.icon} {item.preset.name}
          </Text>
          <TouchableOpacity onPress={() => handleDeleteGame(item.id)}>
            <Icon name="delete" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.gameDate, {color: theme.colors.textSecondary}]}>
          {date.toLocaleDateString('it-IT')} {date.toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}
        </Text>

        {winner ? (
          <Text style={[styles.winner, {color: theme.colors.success}]}>
            🏆 Vincitore: {winner.name}
          </Text>
        ) : (
          <Text style={[styles.noWinner, {color: theme.colors.warning}]}>
            ⚠️ Partita incompleta o abbandonata
          </Text>
        )}

        <View style={styles.players}>
          {item.players.map(player => (
            <View key={player.id} style={styles.playerRow}>
              <Text style={[styles.playerName, {color: theme.colors.text}]}>{player.name}</Text>
              <Text style={[styles.playerScore, {color: theme.colors.textSecondary}]}>{player.score}</Text>
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
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={[styles.emptyTitle, {color: theme.colors.text}]}>Nessuna Partita</Text>
          <Text style={[styles.emptySubtitle, {color: theme.colors.textSecondary}]}>
            Le partite salvate appariranno qui
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={gameHistory}
        renderItem={renderGame}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <TouchableOpacity
              style={[styles.clearButton, {backgroundColor: theme.colors.error}]}
              onPress={handleClearAll}>
              <Text style={styles.clearButtonText}>🗑️ Elimina Tutto lo Storico</Text>
            </TouchableOpacity>
            <AdBanner size="medium" style={styles.adBanner} />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  list: {padding: 16, paddingBottom: 32},
  emptyState: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32},
  emptyIcon: {fontSize: 64, marginBottom: 16},
  emptyTitle: {fontSize: 24, fontWeight: 'bold', marginBottom: 8},
  emptySubtitle: {fontSize: 16, textAlign: 'center'},
  clearButton: {paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8},
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
