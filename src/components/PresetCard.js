import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';
import {CATEGORY_COLORS} from '../constants/colors';

const PresetCard = ({preset, onPress, isSelected = false}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const categoryColor = CATEGORY_COLORS[preset.category] || theme.colors.primary;

  const targetInfo = preset.mode === 'rounds'
    ? t('presetCard.roundsTarget', {rounds: preset.targetRounds})
    : t('presetCard.targetScore', {score: preset.targetScore});

  const accessibilityLabel = isSelected
    ? t('presetCard.presetLabelSelected', {
        presetName: preset.name,
        mode: preset.mode,
        targetInfo: targetInfo,
        playerCount: preset.defaultPlayers
      })
    : t('presetCard.presetLabel', {
        presetName: preset.name,
        mode: preset.mode,
        targetInfo: targetInfo,
        playerCount: preset.defaultPlayers
      });

  return (
    <TouchableOpacity
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={t('presetCard.selectHint')}
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
          accessibilityLabel={t('presetCard.iconLabel', {icon: preset.icon})}
          accessibilityRole="image">
          {preset.icon}
        </Text>
        <View style={[styles.badge, {backgroundColor: categoryColor}]}>
          <Text
            style={styles.badgeText}
            accessibilityLabel={t('presetCard.modeLabel', {mode: preset.mode})}>
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
            ? t('presetCard.roundsTarget', {rounds: preset.targetRounds})
            : `${t('presets.target', {target: preset.targetScore})}`}
        </Text>
        <Text
          style={[styles.infoText, {color: theme.colors.textSecondary}]}
          accessibilityRole="text"
          accessibilityLabel={t('presetCard.playersLabel', {count: preset.defaultPlayers})}>
          👥 {t('presetCard.playersCount', {count: preset.defaultPlayers})}
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
