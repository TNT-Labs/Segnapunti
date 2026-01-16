import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import PresetCard from '../components/PresetCard';
import AdBanner from '../components/AdBanner';
import {DEFAULT_PRESETS} from '../constants/presets';
import {AD_UNITS, AD_BANNER_SIZES} from '../config/adConfig';
import type {PresetsScreenProps} from '../navigation/AppNavigator';
import type {GamePreset} from '../constants/presets';
import type {GameMode, PresetCategory} from '../constants/colors';

interface ModeOption {
  value: GameMode;
  label: string;
}

interface CategoryOption {
  value: PresetCategory;
  label: string;
  icon: string;
}

interface NewPresetForm {
  name: string;
  category: PresetCategory;
  mode: GameMode;
  targetScore: number;
  targetRounds: number;
  roundTargetScore: number;
  defaultPlayers: number;
}

const PresetManagerScreen: React.FC<PresetsScreenProps> = ({navigation}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {addCustomPreset, removeCustomPreset, customPresets} = useGame();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [newPreset, setNewPreset] = useState<NewPresetForm>({
    name: '',
    category: 'other',
    mode: 'max',
    targetScore: 100,
    targetRounds: 3,
    roundTargetScore: 21,
    defaultPlayers: 2,
  });

  const MODES: ModeOption[] = [
    {value: 'max', label: t('presets.modes.max')},
    {value: 'min', label: t('presets.modes.min')},
    {value: 'rounds', label: t('presets.modes.rounds')},
    {value: 'darts', label: t('presets.modes.darts')},
  ];

  const CATEGORIES: CategoryOption[] = [
    {value: 'cards', label: t('presets.categories.cards'), icon: '🃏'},
    {value: 'table', label: t('presets.categories.table'), icon: '🎲'},
    {value: 'sports', label: t('presets.categories.sports'), icon: '⚽'},
    {value: 'other', label: t('presets.categories.other'), icon: '🎯'},
  ];

  // Funzione helper per ottenere l'icona dalla categoria
  const getCategoryIcon = (categoryValue: PresetCategory): string => {
    const category = CATEGORIES.find(cat => cat.value === categoryValue);
    return category ? category.icon : '🎯';
  };

  const handleCreatePreset = (): void => {
    if (!newPreset.name.trim()) {
      Alert.alert(t('common.error'), t('presets.errors.noName'));
      return;
    }

    if (newPreset.defaultPlayers < 2 || newPreset.defaultPlayers > 8) {
      Alert.alert(t('common.error'), t('presets.errors.invalidPlayers'));
      return;
    }

    // Costruisci il preset in base alla modalità
    const basePreset = {
      name: newPreset.name,
      icon: getCategoryIcon(newPreset.category),
      category: newPreset.category,
      mode: newPreset.mode,
      defaultPlayers: newPreset.defaultPlayers,
      incrementValues: [5, 10, 20, 50],
    };

    let presetToAdd: GamePreset;

    if (newPreset.mode === 'rounds') {
      presetToAdd = {
        ...basePreset,
        mode: 'rounds',
        targetRounds: newPreset.targetRounds,
        roundTargetScore: newPreset.roundTargetScore,
        id: `custom_${Date.now()}`,
      };
    } else {
      presetToAdd = {
        ...basePreset,
        mode: newPreset.mode as 'max' | 'min' | 'darts',
        targetScore: newPreset.targetScore,
        id: `custom_${Date.now()}`,
      };
    }

    addCustomPreset(presetToAdd);

    setNewPreset({
      name: '',
      category: 'other',
      mode: 'max',
      targetScore: 100,
      targetRounds: 3,
      roundTargetScore: 21,
      defaultPlayers: 2,
    });
    setShowForm(false);
    Alert.alert(t('common.success'), t('presets.createSuccess'));
  };

  const handleDeletePreset = (presetId: string): void => {
    Alert.alert(
      t('presets.deleteConfirm'),
      t('presets.deleteConfirmMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {text: t('common.delete'), style: 'destructive', onPress: () => removeCustomPreset(presetId)},
      ],
    );
  };

  const handleSelectPreset = (preset: GamePreset): void => {
    Alert.alert(
      preset.name,
      t('presets.usePresetMessage'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('presets.usePreset'),
          onPress: () => {
            navigation.navigate('Settings', {selectedPreset: preset});
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        <TouchableOpacity
          accessible={true}
          accessibilityLabel={showForm ? t('presets.cancelCreateLabel') : t('presets.createLabel')}
          accessibilityHint={showForm ? t('presets.cancelCreateHint') : t('presets.createHint')}
          accessibilityRole="button"
          style={[styles.addButton, {backgroundColor: theme.colors.primary}]}
          onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButtonText}>
            {showForm ? t('presets.cancelCreate') : t('presets.addPreset')}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={[styles.form, {backgroundColor: theme.colors.card}]}>
            <Text style={[styles.label, {color: theme.colors.text}]}>{t('presets.form.nameLabel')}</Text>
            <TextInput
              accessible={true}
              accessibilityLabel={t('presets.form.nameAccessibilityLabel')}
              accessibilityHint={t('presets.form.nameAccessibilityHint')}
              style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
              placeholder={t('presets.form.namePlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              value={newPreset.name}
              onChangeText={text => setNewPreset({...newPreset, name: text})}
            />

            <Text style={[styles.label, {color: theme.colors.text}]}>{t('presets.form.categoryLabel')}</Text>
            <View style={styles.buttonGroup}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.groupButton,
                    {
                      backgroundColor: newPreset.category === cat.value ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setNewPreset({...newPreset, category: cat.value})}>
                  <Text style={[styles.groupButtonText, {color: newPreset.category === cat.value ? '#FFFFFF' : theme.colors.text}]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, {color: theme.colors.text}]}>{t('presets.form.modeLabel')}</Text>
            <View style={styles.buttonGroup}>
              {MODES.map(mode => (
                <TouchableOpacity
                  key={mode.value}
                  style={[
                    styles.groupButton,
                    {
                      backgroundColor: newPreset.mode === mode.value ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => setNewPreset({...newPreset, mode: mode.value})}>
                  <Text style={[styles.groupButtonText, {color: newPreset.mode === mode.value ? '#FFFFFF' : theme.colors.text}]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {newPreset.mode === 'rounds' ? (
              <>
                <Text style={[styles.label, {color: theme.colors.text}]}>{t('presets.form.roundsLabel')}</Text>
                <TextInput
                  style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
                  placeholder={t('presets.form.roundsPlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={String(newPreset.targetRounds)}
                  onChangeText={text => setNewPreset({...newPreset, targetRounds: parseInt(text, 10) || 1})}
                />

                <Text style={[styles.label, {color: theme.colors.text}]}>{t('presets.form.roundTargetLabel')}</Text>
                <TextInput
                  style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
                  placeholder={t('presets.form.roundTargetPlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={String(newPreset.roundTargetScore)}
                  onChangeText={text => setNewPreset({...newPreset, roundTargetScore: parseInt(text, 10) || 1})}
                />
              </>
            ) : (
              <>
                <Text style={[styles.label, {color: theme.colors.text}]}>
                  {newPreset.mode === 'darts' ? t('presets.form.startingScoreLabel') : t('presets.form.targetScoreLabel')}
                </Text>
                <TextInput
                  style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
                  placeholder={t('presets.form.targetScorePlaceholder')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={String(newPreset.targetScore)}
                  onChangeText={text => setNewPreset({...newPreset, targetScore: parseInt(text, 10) || 0})}
                />
              </>
            )}

            <Text style={[styles.label, {color: theme.colors.text}]}>{t('presets.form.defaultPlayersLabel')}</Text>
            <TextInput
              accessible={true}
              accessibilityLabel={t('presets.form.targetScoreAccessibilityLabel')}
              accessibilityHint={t('presets.form.targetScoreAccessibilityHint')}
              style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
              placeholder={t('presets.form.defaultPlayersPlaceholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={String(newPreset.defaultPlayers)}
              onChangeText={text => setNewPreset({...newPreset, defaultPlayers: parseInt(text, 10) || 2})}
            />

            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('presets.createButtonLabel')}
              accessibilityHint={t('presets.createButtonHint')}
              accessibilityRole="button"
              style={[styles.createButton, {backgroundColor: theme.colors.success}]}
              onPress={handleCreatePreset}>
              <Text style={styles.createButtonText}>{t('presets.createButton')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text
          style={[styles.sectionTitle, {color: theme.colors.text}]}
          accessibilityRole="header">
          {t('presets.defaultPresets')}
        </Text>
        {DEFAULT_PRESETS.map(preset => (
          <PresetCard
            key={preset.id}
            preset={preset}
            onPress={() => handleSelectPreset(preset)}
          />
        ))}

        <AdBanner
          size={AD_BANNER_SIZES.PRESET_MANAGER_SCREEN}
          style={styles.adBanner}
          adUnitId={AD_UNITS.PRESET_MANAGER_SCREEN}
        />

        {customPresets.length > 0 && (
          <>
            <Text
              style={[styles.sectionTitle, {color: theme.colors.text}]}
              accessibilityRole="header">
              {t('presets.customPresets')}
            </Text>
            {customPresets.map(preset => (
              <View key={preset.id} style={styles.customPresetWrapper}>
                <View style={{flex: 1}}>
                  <PresetCard
                    preset={preset}
                    onPress={() => handleSelectPreset(preset)}
                  />
                </View>
                <TouchableOpacity
                  accessible={true}
                  accessibilityLabel={t('presets.deletePresetLabel', {presetName: preset.name})}
                  accessibilityHint={t('presets.deletePresetLabelHint')}
                  accessibilityRole="button"
                  style={[styles.deleteButton, {backgroundColor: theme.colors.error}]}
                  onPress={() => handleDeletePreset(preset.id)}>
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 32},
  addButton: {paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 20},
  addButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  form: {padding: 16, borderRadius: 12, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4},
  label: {fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8},
  input: {height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16, marginBottom: 12},
  buttonGroup: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12},
  groupButton: {paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 80},
  groupButtonText: {fontSize: 12, fontWeight: '500', textAlign: 'center'},
  createButton: {paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16},
  createButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  adBanner: {marginVertical: 16},
  sectionTitle: {fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 8},
  customPresetWrapper: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
  deleteButton: {width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center'},
  deleteButtonText: {fontSize: 20},
});

export default PresetManagerScreen;
