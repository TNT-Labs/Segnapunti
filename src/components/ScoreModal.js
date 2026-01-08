import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';

const {width} = Dimensions.get('window');

const ScoreModal = ({visible, onClose, onSubmit, playerName, incrementValues}) => {
  const {theme} = useTheme();
  const [customScore, setCustomScore] = useState('');

  const handleQuickScore = value => {
    onSubmit(value);
    setCustomScore('');
  };

  const handleCustomSubmit = () => {
    const score = parseInt(customScore, 10);
    if (!isNaN(score) && customScore.trim() !== '') {
      onSubmit(score);
      setCustomScore('');
    }
  };

  const handleClose = () => {
    setCustomScore('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}>
        <View
          style={[styles.modal, {backgroundColor: theme.colors.card}]}
          onStartShouldSetResponder={() => true}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Modifica Punteggio
          </Text>
          <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
            {playerName}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder="Es: +10 o -5"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numbers-and-punctuation"
            value={customScore}
            onChangeText={setCustomScore}
            autoFocus
          />

          {incrementValues && (
            <>
              <Text style={[styles.sectionLabel, {color: theme.colors.textSecondary}]}>
                Punteggi Rapidi:
              </Text>
              <View style={styles.quickButtons}>
                {incrementValues.map(value => (
                  <TouchableOpacity
                    key={`pos-${value}`}
                    style={[
                      styles.quickButton,
                      {backgroundColor: theme.colors.success},
                    ]}
                    onPress={() => handleQuickScore(value)}>
                    <Text style={styles.quickButtonText}>+{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.quickButtons}>
                {incrementValues.slice(0, 3).map(value => (
                  <TouchableOpacity
                    key={`neg-${value}`}
                    style={[
                      styles.quickButton,
                      {backgroundColor: theme.colors.error},
                    ]}
                    onPress={() => handleQuickScore(-value)}>
                    <Text style={styles.quickButtonText}>-{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: theme.colors.border}]}
              onPress={handleClose}>
              <Text style={[styles.buttonText, {color: theme.colors.text}]}>
                Annulla
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, {backgroundColor: theme.colors.primary}]}
              onPress={handleCustomSubmit}>
              <Text style={[styles.buttonText, {color: '#FFFFFF'}]}>
                Applica
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 16,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 60,
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScoreModal;
