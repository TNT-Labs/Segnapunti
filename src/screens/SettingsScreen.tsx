import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import PresetCard from '../components/PresetCard';
import AdBanner from '../components/AdBanner';
import LanguageSelector from '../components/LanguageSelector';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {AD_UNITS, AD_BANNER_SIZES} from '../config/adConfig';
import type {SettingsScreenProps} from '../navigation/AppNavigator';
import type {GamePreset} from '../constants/presets';

const SettingsScreen: React.FC<SettingsScreenProps> = ({navigation, route}) => {
  const {t} = useTranslation();
  const {theme, isDark, toggleDarkMode} = useTheme();
  const {getAllPresets, startNewGame, gameState} = useGame();

  const [selectedPreset, setSelectedPreset] = useState<GamePreset | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [showPresets, setShowPresets] = useState<boolean>(false);

  const allPresets = getAllPresets();

  useEffect(() => {
    if (route.params?.selectedPreset) {
      setSelectedPreset(route.params.selectedPreset);
    }
  }, [route.params?.selectedPreset]);

  useEffect(() => {
    if (selectedPreset) {
      const numPlayers = Math.max(2, selectedPreset.defaultPlayers || 2);
      const names = Array.from(
        {length: numPlayers},
        (_, i) => t('settings.playerName', {number: i + 1, defaultValue: `Giocatore ${i + 1}`}),
      );
      setPlayerNames(names);
    }
  }, [selectedPreset, t]);

  const handlePlayerNameChange = (index: number, name: string): void => {
    const updatedNames = [...playerNames];
    updatedNames[index] = name;
    setPlayerNames(updatedNames);
  };

  const handleAddPlayer = (): void => {
    const MAX_PLAYERS = 8;

    if (playerNames.length >= MAX_PLAYERS) {
      Alert.alert(
        t('common.error'),
        t('settings.errors.maxPlayersReached', {count: MAX_PLAYERS})
      );
      return;
    }

    setPlayerNames([...playerNames, t('settings.playerName', {number: playerNames.length + 1, defaultValue: `Giocatore ${playerNames.length + 1}`})]);
  };

  const handleRemovePlayer = (index: number): void => {
    const MIN_PLAYERS = 2;

    if (playerNames.length <= MIN_PLAYERS) {
      Alert.alert(
        t('common.error'),
        t('settings.errors.minPlayersRequired', {count: MIN_PLAYERS})
      );
      return;
    }
    const updatedNames = playerNames.filter((_, i) => i !== index);
    setPlayerNames(updatedNames);
  };

  const handleStartGame = async (): Promise<void> => {
    if (!selectedPreset) {
      Alert.alert(t('common.error'), t('settings.errors.selectPreset'));
      return;
    }

    const validNames = playerNames.filter(name => name.trim() !== '');

    const MIN_PLAYERS = 2;
    const MAX_PLAYERS = 8;

    if (validNames.length < MIN_PLAYERS) {
      Alert.alert(
        t('common.error'),
        t('settings.errors.minPlayers', {count: MIN_PLAYERS})
      );
      return;
    }

    if (validNames.length > MAX_PLAYERS) {
      Alert.alert(
        t('common.error'),
        t('settings.errors.maxPlayers', {count: MAX_PLAYERS})
      );
      return;
    }

    const uniqueNames = new Set(validNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== validNames.length) {
      Alert.alert(t('common.error'), t('settings.errors.duplicateNames'));
      return;
    }

    if (gameState && !gameState.isFinished) {
      Alert.alert(
        t('settings.gameInProgress'),
        t('settings.gameInProgressMessage'),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('settings.newGameAction'),
            style: 'destructive',
            onPress: async () => {
              await startNewGame(selectedPreset, validNames);
              navigation.navigate('Game');
            },
          },
        ],
      );
    } else {
      await startNewGame(selectedPreset, validNames);
      navigation.navigate('Game');
    }
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}>

      {/* Game Setup Section - PRIMARY */}
      <Text
        style={[styles.sectionTitle, {color: theme.colors.text}]}
        accessibilityRole="header">
        {t('settings.newGame')}
      </Text>

      {/* Preset Selection */}
      <TouchableOpacity
        accessible={true}
        accessibilityLabel={selectedPreset
          ? `${t('settings.selectGame')}: ${selectedPreset.name}`
          : t('settings.selectGame')}
        accessibilityHint={showPresets ? t('settings.closeGameList') : t('settings.selectGameHint')}
        accessibilityRole="button"
        accessibilityState={{expanded: showPresets}}
        style={[styles.section, {backgroundColor: theme.colors.card}]}
        onPress={() => setShowPresets(!showPresets)}>
        <View style={styles.row}>
          <Text style={[styles.label, {color: theme.colors.text}]}>
            {selectedPreset
              ? `${selectedPreset.icon} ${selectedPreset.name}`
              : t('settings.selectGame')}
          </Text>
          <Icon
            name={showPresets ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={theme.colors.text}
          />
        </View>
      </TouchableOpacity>

      {showPresets && (
        <View style={styles.presetsList}>
          {allPresets.map(preset => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPreset?.id === preset.id}
              onPress={() => {
                setSelectedPreset(preset);
                setShowPresets(false);
              }}
            />
          ))}
        </View>
      )}

      {/* Player Names */}
      {selectedPreset && (
        <>
          <View style={styles.playersHeader}>
            <Text
              style={[styles.sectionTitle, {color: theme.colors.text}]}
              accessibilityRole="header">
              {t('settings.players')}
            </Text>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('settings.addPlayer')}
              accessibilityHint={t('settings.addPlayerHint')}
              accessibilityRole="button"
              style={[styles.addPlayerButton, {backgroundColor: theme.colors.primary}]}
              onPress={handleAddPlayer}>
              <Icon name="account-plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {playerNames.map((name, index) => (
            <View
              key={index}
              style={[styles.playerInput, {backgroundColor: theme.colors.card}]}>
              <View style={[styles.playerNumber, {backgroundColor: theme.colors.primary + '20'}]}>
                <Text style={[styles.playerNumberText, {color: theme.colors.primary}]}>{index + 1}</Text>
              </View>
              <TextInput
                accessible={true}
                accessibilityLabel={t('settings.playerName', {number: index + 1})}
                accessibilityHint={t('settings.playerNameHint')}
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    flex: 1,
                  },
                ]}
                placeholder={t('settings.playerName', {number: index + 1})}
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={text => handlePlayerNameChange(index, text)}
                selectTextOnFocus
              />
              {playerNames.length > 2 && (
                <TouchableOpacity
                  accessible={true}
                  accessibilityLabel={t('settings.removePlayer', {name: name || t('settings.playerName', {number: index + 1})})}
                  accessibilityHint={t('settings.removePlayerHint')}
                  accessibilityRole="button"
                  style={[styles.removeButton, {backgroundColor: theme.colors.error}]}
                  onPress={() => handleRemovePlayer(index)}>
                  <Icon name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            accessible={true}
            accessibilityLabel={t('settings.startGame')}
            accessibilityHint={t('settings.startGameHint', {
              gameName: selectedPreset.name,
              playerCount: playerNames.filter(n => n.trim()).length
            })}
            accessibilityRole="button"
            style={[styles.startButton, {backgroundColor: theme.colors.success}]}
            onPress={handleStartGame}>
            <Icon name="play-circle" size={22} color="#FFFFFF" style={{marginRight: 8}} />
            <Text style={styles.startButtonText}>{t('settings.startGame')}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* App Settings Section - SECONDARY */}
      <View style={styles.settingsDivider}>
        <View style={[styles.dividerLine, {backgroundColor: theme.colors.border}]} />
        <Text style={[styles.dividerText, {color: theme.colors.textSecondary}]}>
          {t('settings.appSettings')}
        </Text>
        <View style={[styles.dividerLine, {backgroundColor: theme.colors.border}]} />
      </View>

      {/* Language Selector */}
      <LanguageSelector />

      {/* Dark Mode Toggle */}
      <View style={[styles.section, {backgroundColor: theme.colors.card}]}>
        <View style={styles.row}>
          <Text
            style={[styles.label, {color: theme.colors.text}]}>
            {t('settings.darkMode')}
          </Text>
          <Switch
            accessible={true}
            accessibilityLabel={isDark ? t('settings.darkModeActive') : t('settings.darkModeInactive')}
            accessibilityHint={t('settings.darkModeHint')}
            accessibilityRole="switch"
            value={isDark}
            onValueChange={toggleDarkMode}
          />
        </View>
      </View>

      <AdBanner
        size={AD_BANNER_SIZES.SETTINGS_SCREEN}
        style={styles.adBanner}
        adUnitId={AD_UNITS.SETTINGS_SCREEN}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 32},
  sectionTitle: {fontSize: 20, fontWeight: '600', marginTop: 8, marginBottom: 12},
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {fontSize: 16, fontWeight: '500'},
  adBanner: {marginVertical: 16},
  presetsList: {marginBottom: 12},
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPlayerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  playerNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    fontSize: 16,
    padding: 4,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 12,
  },
});

export default SettingsScreen;
