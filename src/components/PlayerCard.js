import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PlayerCard = ({player, onAddScore, onSubtractScore, showActions = true}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.card}]}>
      <View style={styles.leftSection}>
        <Text style={[styles.playerName, {color: theme.colors.text}]}>
          {player.name}
        </Text>
        {player.roundsWon !== undefined && (
          <Text style={[styles.rounds, {color: theme.colors.textSecondary}]}>
            🏆 Rounds: {player.roundsWon}
          </Text>
        )}
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.score, {color: theme.colors.primary}]}>
          {player.score}
        </Text>

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: theme.colors.error}]}
              onPress={() => onSubtractScore(player.id)}>
              <Icon name="minus" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, {backgroundColor: theme.colors.success}]}
              onPress={() => onAddScore(player.id)}>
              <Icon name="plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  rounds: {
    fontSize: 14,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  score: {
    fontSize: 28,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlayerCard;
