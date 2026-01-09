import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import PresetCard from '../components/PresetCard';
import {DEFAULT_PRESETS} from '../constants/presets';

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
    defaultPlayers: 2,
  });

  const allPresets = getAllPresets();

  const handleCreatePreset = () => {
    if (!newPreset.name.trim()) {
      Alert.alert('Errore', 'Inserisci un nome per il preset!');
      return;
    }

    addCustomPreset({
      ...newPreset,
      incrementValues: [5, 10, 20, 50],
    });

    setNewPreset({
      name: '',
      icon: '🎮',
      category: 'other',
      mode: 'max',
      targetScore: 100,
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
            <TextInput
              accessible={true}
              accessibilityLabel="Nome preset"
              accessibilityHint="Inserisci il nome del nuovo preset"
              style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
              placeholder="Nome preset"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPreset.name}
              onChangeText={text => setNewPreset({...newPreset, name: text})}
            />

            <TextInput
              accessible={true}
              accessibilityLabel="Icona preset"
              accessibilityHint="Inserisci un'emoji per l'icona del preset"
              style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
              placeholder="Icona (emoji)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newPreset.icon}
              onChangeText={text => setNewPreset({...newPreset, icon: text})}
            />

            <TextInput
              accessible={true}
              accessibilityLabel="Punteggio target"
              accessibilityHint="Inserisci il punteggio obiettivo del preset"
              style={[styles.input, {backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border}]}
              placeholder="Punteggio target"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              value={String(newPreset.targetScore)}
              onChangeText={text => setNewPreset({...newPreset, targetScore: parseInt(text, 10) || 0})}
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
  input: {height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, fontSize: 16, marginBottom: 12},
  createButton: {paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8},
  createButtonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  sectionTitle: {fontSize: 20, fontWeight: 'bold', marginBottom: 12, marginTop: 8},
  customPresetWrapper: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12},
  deleteButton: {width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center'},
  deleteButtonText: {fontSize: 20},
});

export default PresetManagerScreen;
