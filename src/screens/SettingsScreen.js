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
import {useTheme} from '../contexts/ThemeContext';
import {useGame} from '../contexts/GameContext';
import PresetCard from '../components/PresetCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SettingsScreen = ({navigation, route}) => {
  const {theme, isDark, toggleDarkMode} = useTheme();
  const {getAllPresets, startNewGame, gameState} = useGame();

  const [selectedPreset, setSelectedPreset] = useState(null);
  const [playerNames, setPlayerNames] = useState([]);
  const [showPresets, setShowPresets] = useState(false);

  const allPresets = getAllPresets();

  // Gestisce preset passato dalla navigazione
  useEffect(() => {
    if (route.params?.selectedPreset) {
      setSelectedPreset(route.params.selectedPreset);
      // Reset del parametro per evitare problemi
      navigation.setParams({selectedPreset: undefined});
    }
  }, [route.params?.selectedPreset, navigation]);

  useEffect(() => {
    if (selectedPreset) {
      // Inizializza array giocatori con nomi di default
      const names = Array.from(
        {length: selectedPreset.defaultPlayers},
        (_, i) => `Giocatore ${i + 1}`,
      );
      setPlayerNames(names);
    }
  }, [selectedPreset]);

  const handlePlayerNameChange = (index, name) => {
    const updatedNames = [...playerNames];
    updatedNames[index] = name;
    setPlayerNames(updatedNames);
  };

  const handleAddPlayer = () => {
    setPlayerNames([...playerNames, `Giocatore ${playerNames.length + 1}`]);
  };

  const handleRemovePlayer = index => {
    if (playerNames.length <= 1) {
      Alert.alert('Errore', 'Devi avere almeno 1 giocatore!');
      return;
    }
    const updatedNames = playerNames.filter((_, i) => i !== index);
    setPlayerNames(updatedNames);
  };

  const handleStartGame = async () => {
    if (!selectedPreset) {
      Alert.alert('Errore', 'Seleziona un preset di gioco!');
      return;
    }

    const validNames = playerNames.filter(name => name.trim() !== '');
    if (validNames.length === 0) {
      Alert.alert('Errore', 'Inserisci almeno un nome giocatore!');
      return;
    }

    if (gameState && !gameState.isFinished) {
      Alert.alert(
        'Partita in Corso',
        'C\'è già una partita in corso. Vuoi abbandonarla e iniziarne una nuova?',
        [
          {text: 'Annulla', style: 'cancel'},
          {
            text: 'Nuova Partita',
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
      Alert.alert('Partita Iniziata!', 'Buon divertimento! 🎉', [
        {text: 'OK', onPress: () => navigation.navigate('Game')},
      ]);
    }
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}>
      <Text
        style={[styles.title, {color: theme.colors.text}]}
        accessibilityRole="header">
        ⚙️ Impostazioni
      </Text>

      {/* Dark Mode Toggle */}
      <View style={[styles.section, {backgroundColor: theme.colors.card}]}>
        <View style={styles.row}>
          <Text
            style={[styles.label, {color: theme.colors.text}]}
            accessibilityRole="text">
            🌙 Dark Mode
          </Text>
          <Switch
            accessible={true}
            accessibilityLabel={isDark ? "Dark mode attivo" : "Dark mode disattivo"}
            accessibilityHint="Attiva o disattiva la modalità scura"
            accessibilityRole="switch"
            value={isDark}
            onValueChange={toggleDarkMode}
          />
        </View>
      </View>

      {/* Nuova Partita */}
      <Text
        style={[styles.sectionTitle, {color: theme.colors.text}]}
        accessibilityRole="header">
        🎮 Nuova Partita
      </Text>

      {/* Preset Selection */}
      <TouchableOpacity
        accessible={true}
        accessibilityLabel={selectedPreset
          ? `Gioco selezionato: ${selectedPreset.name}. Tocca per cambiare`
          : 'Seleziona un gioco'}
        accessibilityHint={showPresets ? "Chiudi lista giochi" : "Apri lista giochi"}
        accessibilityRole="button"
        accessibilityState={{expanded: showPresets}}
        style={[styles.section, {backgroundColor: theme.colors.card}]}
        onPress={() => setShowPresets(!showPresets)}>
        <View style={styles.row}>
          <Text style={[styles.label, {color: theme.colors.text}]}>
            {selectedPreset
              ? `${selectedPreset.icon} ${selectedPreset.name}`
              : 'Seleziona Gioco'}
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
              👥 Giocatori
            </Text>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Aggiungi giocatore"
              accessibilityHint="Aggiunge un nuovo campo per inserire un giocatore"
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
              <TextInput
                accessible={true}
                accessibilityLabel={`Nome giocatore ${index + 1}`}
                accessibilityHint="Inserisci il nome del giocatore"
                style={[
                  styles.input,
                  {
                    color: theme.colors.text,
                    flex: 1,
                  },
                ]}
                placeholder={`Giocatore ${index + 1}`}
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={text => handlePlayerNameChange(index, text)}
              />
              {playerNames.length > 1 && (
                <TouchableOpacity
                  accessible={true}
                  accessibilityLabel={`Rimuovi ${name || `giocatore ${index + 1}`}`}
                  accessibilityHint="Rimuove questo giocatore dalla lista"
                  accessibilityRole="button"
                  style={[styles.removeButton, {backgroundColor: theme.colors.error}]}
                  onPress={() => handleRemovePlayer(index)}>
                  <Icon name="minus" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Inizia partita"
            accessibilityHint={`Avvia una nuova partita a ${selectedPreset.name} con ${playerNames.filter(n => n.trim()).length} giocatori`}
            accessibilityRole="button"
            style={[styles.startButton, {backgroundColor: theme.colors.success}]}
            onPress={handleStartGame}>
            <Text style={styles.startButtonText}>🚀 Inizia Partita</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 32},
  title: {fontSize: 28, fontWeight: 'bold', marginBottom: 20},
  sectionTitle: {fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 12},
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  input: {
    fontSize: 16,
    padding: 4,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
