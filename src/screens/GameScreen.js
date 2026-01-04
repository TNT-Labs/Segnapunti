import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';

const GameScreen = () => {
  const {theme} = useTheme();
  const {gameState, players, currentPreset} = useGame();

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          🃏 Partita in Corso
        </Text>

        {!gameState ? (
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            Nessuna partita attiva.{'\n'}
            Vai in Impostazioni per iniziare una nuova partita!
          </Text>
        ) : (
          <>
            <Text style={[styles.presetName, {color: theme.colors.primary}]}>
              {currentPreset?.name}
            </Text>

            {players.map(player => (
              <View
                key={player.id}
                style={[styles.playerCard, {backgroundColor: theme.colors.card}]}>
                <Text style={[styles.playerName, {color: theme.colors.text}]}>
                  {player.name}
                </Text>
                <Text style={[styles.playerScore, {color: theme.colors.primary}]}>
                  {player.score}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  presetName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  playerCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '500',
  },
  playerScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default GameScreen;
