import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import PresetCard from '../components/PresetCard';
import AdBanner from '../components/AdBanner';
import {DEFAULT_PRESETS} from '../constants/presets';
import {AD_UNITS, AD_BANNER_SIZES} from '../config/adConfig';

const PresetManagerScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {getAllPresets, addCustomPreset, removeCustomPreset, customPresets, startNewGame} = useGame();

  const [showForm, setShowForm] = useState(false);
  const [newPreset, setNewPreset] = useState({
    name: '',
    icon: '🎮',
    category: 'other',
    mode: 'max',
    targetScore: 100,
    targetRounds: 3,
    roundTargetScore: 21,
    defaultPlayers: 2,
  });

  const allPresets = getAllPresets();

  const MODES = [
    {value: 'max', label: 'Max (primo a raggiungere)'},
    {value: 'min', label: 'Min (ultimo a superare)'},
    {value: 'rounds', label: 'Rounds (migliore di X round)'},
    {value: 'darts', label: 'Darts (da X a 0)'},
  ];

  const CATEGORIES = [
    {value: 'cards', label: '🃏 Carte'},
    {value: 'table', label: '🎲 Giochi da Tavolo'},
    {value: 'sports', label: '⚽ Sport'},
    {value: 'other', label: '🎯 Altri'},
  ];

  const handleCreatePreset = () => {
    if (!newPreset.name.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per il preset!');
      return;
    }

    if (newPreset.defaultPlayers < 2 || newPreset.defaultPlayers > 8) {
      Alert.alert('Errore', 'Il numero di giocatori deve essere tra 2 e 8!');
      return;
    }

    // Costruisci il preset in base alla modalità
    const presetToAdd = {
      name: newPreset.name,
      icon: newPreset.icon,
      category: newPreset.category,
      mode: newPreset.mode,
      defaultPlayers: newPreset.defaultPlayers,
      incrementValues: [5, 10, 20, 50],
    };

    if (newPreset.mode === 'rounds') {
      presetToAdd.targetRounds = newPreset.targetRounds;
      presetToAdd.roundTargetScore = newPreset.roundTargetScore;
    } else {
      presetToAdd.targetScore = newPreset.targetScore;
    }

    addCustomPreset(presetToAdd);

    setNewPreset({
      name: '',
      icon: '🎮',
      category: 'other',
      mode: 'max',
      targetScore: 100,
      targetRounds: 3,
      roundTargetScore: 21,
      defaultPlayers: 2,
    });
    setShowForm(false);
    Alert.alert('Successo', 'Preset creato con successo!');
  };

  const handleDeletePreset = presetId => {
    Alert.alert(
      'Elimina Preset',
      'Vuoi davvero eliminare questo preset personalizzato?',
      [
        {text: 'Annulla', style: 'cancel'},
        {text: 'Elimina', style: 'destructive', onPress: () => removeCustomPreset(presetId)},
      ],
    );
  };

  const handleSelectPreset = preset => {
    Alert.alert(
      preset.name,
      'Vuoi usare questo preset per iniziare una partita?',
      [
        {text: 'Annulla', style: 'cancel'},
        {
          text: 'Usa Preset',
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
          accessibilityLabel={showForm ? "Annulla creazione preset" : "Crea preset personalizzato"}
          accessibilityHint={showForm ? "Chiudi il form di creazione" : "Apri il form per creare un nuovo preset"}
          accessibilityRole="button"
          style={[styles.addButton, {backgroundColor: theme.colors.primary}]}
          onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButtonText}>
            {showForm ? '❌ Annulla' : '➕ Crea Preset Personalizzato'}
          </Text>
        </TouchableOpacity>

        {showForm && (
          <View style={[styles.form, {backgroundColor: theme.colors.card}]}>
            <Text style={[styles.label, {color: theme.colors.text}]}>Nome Preset</Text>
            <TextInput
              accessible={true}
              accessibilityLabel="Nome preset"
              accessibilityHint="Inserisci il nome del nuovo preset"
              style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
              placeholder="Es: Mio Gioco Preferito"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPreset.name}
              onChangeText={text => setNewPreset({...newPreset, name: text})}
            />

            <Text style={[styles.label, {color: theme.colors.text}]}>Icona (emoji)</Text>
            <TextInput
              accessible={true}
              accessibilityLabel="Icona preset"
              accessibilityHint="Inserisci un'emoji per l'icona del preset"
              style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
              placeholder="🎮"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPreset.icon}
              onChangeText={text => setNewPreset({...newPreset, icon: text})}
              maxLength={2}
            />

            <Text style={[styles.label, {color: theme.colors.text}]}>Categoria</Text>
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

            <Text style={[styles.label, {color: theme.colors.text}]}>Modalità di Gioco</Text>
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
                <Text style={[styles.label, {color: theme.colors.text}]}>Numero di Round da Vincere</Text>
                <TextInput
                  style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
                  placeholder="3"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={String(newPreset.targetRounds)}
                  onChangeText={text => setNewPreset({...newPreset, targetRounds: parseInt(text, 10) || 1})}
                />

                <Text style={[styles.label, {color: theme.colors.text}]}>Punteggio per Vincere un Round</Text>
                <TextInput
                  style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
                  placeholder="21"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={String(newPreset.roundTargetScore)}
                  onChangeText={text => setNewPreset({...newPreset, roundTargetScore: parseInt(text, 10) || 1})}
                />
              </>
            ) : (
              <>
                <Text style={[styles.label, {color: theme.colors.text}]}>
                  {newPreset.mode === 'darts' ? 'Punteggio Iniziale' : 'Punteggio Target'}
                </Text>
                <TextInput
                  style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
                  placeholder="100"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  value={String(newPreset.targetScore)}
                  onChangeText={text => setNewPreset({...newPreset, targetScore: parseInt(text, 10) || 0})}
                />
              </>
            )}

            <Text style={[styles.label, {color: theme.colors.text}]}>Numero Giocatori Predefinito (2-8)</Text>
            <TextInput
              accessible={true}
              accessibilityLabel="Punteggio target"
              accessibilityHint="Inserisci il punteggio obiettivo del preset"
              style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
              placeholder="2"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={String(newPreset.defaultPlayers)}
              onChangeText={text => setNewPreset({...newPreset, defaultPlayers: parseInt(text, 10) || 2})}
            />

            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Conferma creazione preset"
              accessibilityHint="Salva il nuovo preset personalizzato"
              accessibilityRole="button"
              style={[styles.createButton, {backgroundColor: theme.colors.success}]}
              onPress={handleCreatePreset}>
              <Text style={styles.createButtonText}>✅ Crea Preset</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text
          style={[styles.sectionTitle, {color: theme.colors.text}]}
          accessibilityRole="header">
          Preset Predefiniti
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
              Preset Personalizzati
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
                  accessibilityLabel={`Elimina preset ${preset.name}`}
                  accessibilityHint="Rimuove questo preset personalizzato dalla lista"
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
