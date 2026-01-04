import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';

const HistoryScreen = () => {
  const {theme} = useTheme();
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.text, {color: theme.colors.text}]}>📜 Storico Partite</Text>
      <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
        Da implementare: Lista storico partite
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  text: {fontSize: 24, fontWeight: 'bold'},
  subtitle: {fontSize: 16, marginTop: 10},
});

export default HistoryScreen;
