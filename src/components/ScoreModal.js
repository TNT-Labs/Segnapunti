import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';

const ScoreModal = ({visible, onClose, onSubmit, playerName, incrementValues}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {width} = useWindowDimensions();
  const [customScore, setCustomScore] = useState('');

  const MIN_SCORE = -9999;
  const MAX_SCORE = 9999;

  const handleQuickScore = value => {
    onSubmit(value);
    setCustomScore('');
  };

  const handleCustomSubmit = () => {
    const score = parseInt(customScore, 10);

    if (isNaN(score) || customScore.trim() === '') {
      Alert.alert(t('common.error'), t('scoreModal.errors.invalidScore'));
      return;
    }

    if (score < MIN_SCORE || score > MAX_SCORE) {
      Alert.alert(
        t('scoreModal.invalidScoreTitle'),
        t('scoreModal.errors.invalidRange', {min: MIN_SCORE, max: MAX_SCORE})
      );
      return;
    }

    onSubmit(score);
    setCustomScore('');
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
        accessible={true}
        accessibilityLabel={t('scoreModal.closeModal')}
        accessibilityRole="button"
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}>
        <View
          style={[styles.modal, {backgroundColor: theme.colors.card}]}
          onStartShouldSetResponder={() => true}>
          <Text
            style={[styles.title, {color: theme.colors.text}]}
            accessibilityRole="header">
            {t('scoreModal.title')}
          </Text>
          <Text
            style={[styles.subtitle, {color: theme.colors.textSecondary}]}
            accessibilityRole="text">
            {t('scoreModal.playerName', {name: playerName})}
          </Text>

          <TextInput
            accessible={true}
            accessibilityLabel={t('scoreModal.customScore')}
            accessibilityHint={t('scoreModal.customScoreHint')}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder={t('scoreModal.placeholder')}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numbers-and-punctuation"
            value={customScore}
            onChangeText={setCustomScore}
            autoFocus
          />

          {incrementValues && (
            <View style={styles.quickButtons}>
              {incrementValues.map(value => (
                <TouchableOpacity
                  key={value}
                  accessible={true}
                  accessibilityLabel={t('scoreModal.addPoints', {points: value})}
                  accessibilityHint={t('scoreModal.addPointsHint', {points: value})}
                  accessibilityRole="button"
                  style={[
                    styles.quickButton,
                    {backgroundColor: theme.colors.primary},
                  ]}
                  onPress={() => handleQuickScore(value)}>
                  <Text style={styles.quickButtonText}>+{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('scoreModal.cancel')}
              accessibilityHint={t('scoreModal.cancelHint')}
              accessibilityRole="button"
              style={[styles.button, {backgroundColor: theme.colors.border}]}
              onPress={handleClose}>
              <Text style={[styles.buttonText, {color: theme.colors.text}]}>
                {t('scoreModal.cancel')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('scoreModal.apply')}
              accessibilityHint={t('scoreModal.applyHint')}
              accessibilityRole="button"
              style={[styles.button, {backgroundColor: theme.colors.primary}]}
              onPress={handleCustomSubmit}>
              <Text style={[styles.buttonText, {color: '#FFFFFF'}]}>
                {t('scoreModal.apply')}
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
