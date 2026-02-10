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

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (score: number) => void;
  playerName: string | undefined;
  incrementValues?: number[];
}

const ScoreModal: React.FC<ScoreModalProps> = ({
  visible,
  onClose,
  onSubmit,
  playerName,
  incrementValues,
}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {width} = useWindowDimensions();
  const [customScore, setCustomScore] = useState<string>('');

  const MIN_SCORE = -9999;
  const MAX_SCORE = 9999;

  const handleQuickScore = (value: number): void => {
    onSubmit(value);
    setCustomScore('');
  };

  const handleCustomSubmit = (): void => {
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

  const handleClose = (): void => {
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
          style={[styles.modal, {backgroundColor: theme.colors.card, width: width * 0.9}]}
          onStartShouldSetResponder={() => true}>
          <Text
            style={[styles.title, {color: theme.colors.text}]}
            accessibilityRole="header">
            {t('scoreModal.title')}
          </Text>
          <Text
            style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
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

          {incrementValues && incrementValues.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, {color: theme.colors.textSecondary}]}>
                {t('scoreModal.quickAdd')}
              </Text>
              <View style={styles.quickButtons}>
                {incrementValues.map(value => (
                  <TouchableOpacity
                    key={`add-${value}`}
                    accessible={true}
                    accessibilityLabel={t('scoreModal.addPoints', {points: value})}
                    accessibilityRole="button"
                    style={[styles.quickButton, {backgroundColor: theme.colors.success}]}
                    onPress={() => handleQuickScore(value)}>
                    <Text style={styles.quickButtonText}>+{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionLabel, {color: theme.colors.textSecondary}]}>
                {t('scoreModal.quickSubtract')}
              </Text>
              <View style={styles.quickButtons}>
                {incrementValues.map(value => (
                  <TouchableOpacity
                    key={`sub-${value}`}
                    accessible={true}
                    accessibilityLabel={t('scoreModal.subtractPoints', {points: value})}
                    accessibilityRole="button"
                    style={[styles.quickButton, {backgroundColor: theme.colors.error}]}
                    onPress={() => handleQuickScore(-value)}>
                    <Text style={styles.quickButtonText}>-{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
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
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  quickButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 56,
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
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
