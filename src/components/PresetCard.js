import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {CATEGORY_COLORS} from '../constants/colors';

const PresetCard = ({preset, onPress, isSelected = false}) => {
  const {theme} = useTheme();

  const categoryColor = CATEGORY_COLORS[preset.category] || theme.colors.primary;

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={`Preset ${preset.name}, modalità ${preset.mode}, ${
        preset.mode === 'rounds'
          ? `${preset.targetRounds} rounds`
          : `punteggio target ${preset.targetScore}`
      }, ${preset.defaultPlayers} giocatori${isSelected ? ', selezionato' : ''}`}
      accessibilityHint="Tocca per selezionare questo preset"
      accessibilityRole="button"
      accessibilityState={{selected: isSelected}}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onPress}>
      <View style={styles.header}>
        <Text
          style={styles.icon}
          accessibilityLabel={`Icona ${preset.icon}`}
          accessibilityRole="image">
          {preset.icon}
        </Text>
        <View style={[styles.badge, {backgroundColor: categoryColor}]}>
          <Text
            style={styles.badgeText}
            accessibilityLabel={`Modalità ${preset.mode}`}>
            {preset.mode.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.name, {color: theme.colors.text}]}
        accessibilityRole="header">
        {preset.name}
      </Text>

      <View style={styles.info}>
        <Text
          style={[styles.infoText, {color: theme.colors.textSecondary}]}
          accessibilityRole="text">
          {preset.mode === 'rounds'
            ? `${preset.targetRounds} rounds`
            : `Target: ${preset.targetScore}`}
        </Text>
        <Text
          style={[styles.infoText, {color: theme.colors.textSecondary}]}
          accessibilityRole="text"
          accessibilityLabel={`${preset.defaultPlayers} giocatori predefiniti`}>
          👥 {preset.defaultPlayers} giocatori
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 32,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: 14,
  },
});

export default PresetCard;
