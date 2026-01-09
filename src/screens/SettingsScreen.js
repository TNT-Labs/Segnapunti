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
import AdBanner from '../components/AdBanner';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import consentService from '../services/ConsentService';

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
    }
  }, [route.params?.selectedPreset]);

  // Pulisci params dopo averli letti
  useEffect(() => {
    return () => {
      if (route.params?.selectedPreset) {
        navigation.setParams({selectedPreset: null});
      }
    };
  }, [navigation, route.params?.selectedPreset]);

  useEffect(() => {
    if (selectedPreset) {
      // Inizializza array giocatori con nomi di default
      // Assicurati di avere almeno 2 giocatori
      const numPlayers = Math.max(2, selectedPreset.defaultPlayers || 2);
      const names = Array.from(
        {length: numPlayers},
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
    const MAX_PLAYERS = 8;

    if (playerNames.length >= MAX_PLAYERS) {
      Alert.alert('Limite Raggiunto', `Puoi aggiungere al massimo ${MAX_PLAYERS} giocatori.`);
      return;
    }

    setPlayerNames([...playerNames, `Giocatore ${playerNames.length + 1}`]);
  };

  const handleRemovePlayer = index => {
    const MIN_PLAYERS = 2;

    if (playerNames.length <= MIN_PLAYERS) {
      Alert.alert('Errore', `Devi avere almeno ${MIN_PLAYERS} giocatori!`);
      return;
    }
    const updatedNames = playerNames.filter((_, i) => i !== index);
    setPlayerNames(updatedNames);
  };

  const handlePrivacySettings = async () => {
    try {
      // Ottieni lo stato attuale del consenso
      const consentInfo = consentService.getConsentInfo();
      const canShowPersonalized = consentService.canShowPersonalizedAds();

      let statusMessage = 'Stato attuale: ';
      if (!consentInfo) {
        statusMessage += 'Non inizializzato';
      } else if (consentInfo.status === 1) { // OBTAINED
        statusMessage += canShowPersonalized
          ? '✅ Consenso dato per annunci personalizzati'
          : '❌ Consenso negato per annunci personalizzati';
      } else if (consentInfo.status === 3) { // NOT_REQUIRED
        statusMessage += 'Non richiesto nella tua regione';
      } else {
        statusMessage += 'Sconosciuto';
      }

      Alert.alert(
        'Impostazioni Privacy',
        `${statusMessage}\n\nVuoi modificare le tue preferenze sulla privacy?`,
        [
          {
            text: 'Annulla',
            style: 'cancel',
          },
          {
            text: 'Visualizza Privacy Policy',
            onPress: () => {
              const privacyUrl = 'https://tnt-labs.github.io/Segnapunti/privacy-policy.html';
              require('react-native').Linking.openURL(privacyUrl);
            },
          },
          {
            text: 'Modifica Consenso',
            onPress: async () => {
              // Reset del consenso e mostra il form di nuovo
              await consentService.resetConsent();
              const result = await consentService.initialize();

              if (result.isRequired) {
                const consentResult = await consentService.showConsentForm();
                Alert.alert(
                  'Preferenze Aggiornate',
                  `Le tue preferenze sulla privacy sono state aggiornate. Stato: ${consentResult.status}`,
                );
              } else {
                Alert.alert(
                  'Informazione',
                  'Il consenso GDPR non è richiesto nella tua regione.',
                );
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('Errore nelle impostazioni privacy:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante la gestione delle impostazioni privacy.');
    }
  };

  const handleStartGame = async () => {
    if (!selectedPreset) {
      Alert.alert('Errore', 'Seleziona un preset di gioco!');
      return;
    }

    const validNames = playerNames.filter(name => name.trim() !== '');

    // Validazione numero giocatori
    const MIN_PLAYERS = 2;
    const MAX_PLAYERS = 8;

    if (validNames.length < MIN_PLAYERS) {
      Alert.alert('Errore', `Servono almeno ${MIN_PLAYERS} giocatori per iniziare una partita!`);
      return;
    }

    if (validNames.length > MAX_PLAYERS) {
      Alert.alert('Errore', `Puoi avere al massimo ${MAX_PLAYERS} giocatori!`);
      return;
    }

    // Verifica nomi duplicati
    const uniqueNames = new Set(validNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== validNames.length) {
      Alert.alert('Errore', 'Ci sono nomi di giocatori duplicati! Ogni giocatore deve avere un nome unico.');
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

      {/* Privacy Settings */}
      <TouchableOpacity
        accessible={true}
        accessibilityLabel="Impostazioni privacy"
        accessibilityHint="Gestisci le tue preferenze sulla privacy e il consenso per gli annunci"
        accessibilityRole="button"
        style={[styles.section, {backgroundColor: theme.colors.card}]}
        onPress={handlePrivacySettings}>
        <View style={styles.row}>
          <Text
            style={[styles.label, {color: theme.colors.text}]}
            accessibilityRole="text">
            🔒 Privacy & Consenso GDPR
          </Text>
          <Icon
            name="chevron-right"
            size={24}
            color={theme.colors.text}
          />
        </View>
      </TouchableOpacity>

      <AdBanner
        size="small"
        style={styles.adBanner}
        adUnitId="ca-app-pub-4302173868436591/2155550079"
      />

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
