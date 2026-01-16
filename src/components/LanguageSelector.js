import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal, FlatList} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import i18nService from '../services/i18nService';

const LanguageSelector = () => {
  const {t, i18n} = useTranslation();
  const {theme} = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const languages = i18nService.getAvailableLanguages();
  const currentLanguage = i18n.language || 'it';

  const getCurrentLanguageName = () => {
    const lang = languages.find(l => l.code === currentLanguage);
    return lang ? `${lang.flag} ${lang.name}` : 'Italiano';
  };

  const handleLanguageChange = async languageCode => {
    await i18nService.changeLanguage(languageCode);
    setModalVisible(false);
  };

  const renderLanguageItem = ({item}) => {
    const isSelected = item.code === currentLanguage;

    return (
      <TouchableOpacity
        accessible={true}
        accessibilityLabel={`${item.name} - ${isSelected ? t('settings.languageSelected', {defaultValue: 'Selected'}) : ''}`}
        accessibilityRole="button"
        style={[
          styles.languageItem,
          {backgroundColor: theme.colors.card},
          isSelected && {backgroundColor: theme.colors.primary + '20'},
        ]}
        onPress={() => handleLanguageChange(item.code)}>
        <Text style={styles.flagText}>{item.flag}</Text>
        <Text
          style={[
            styles.languageName,
            {color: theme.colors.text},
            isSelected && {fontWeight: 'bold'},
          ]}>
          {item.name}
        </Text>
        {isSelected && (
          <Icon name="check" size={24} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        accessible={true}
        accessibilityLabel={t('settings.language', {defaultValue: 'Language'})}
        accessibilityHint={t('settings.languageHint', {defaultValue: 'Select application language'})}
        accessibilityRole="button"
        style={[styles.section, {backgroundColor: theme.colors.card}]}
        onPress={() => setModalVisible(true)}>
        <View style={styles.row}>
          <Text style={[styles.label, {color: theme.colors.text}]}>
            🌍 {t('settings.language', {defaultValue: 'Lingua'})}
          </Text>
          <View style={styles.languageValue}>
            <Text style={[styles.languageText, {color: theme.colors.text}]}>
              {getCurrentLanguageName()}
            </Text>
            <Icon name="chevron-down" size={24} color={theme.colors.text} />
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View
            style={[styles.modalContent, {backgroundColor: theme.colors.background}]}
            onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
              {t('settings.language', {defaultValue: 'Lingua'})}
            </Text>
            <FlatList
              data={languages}
              renderItem={renderLanguageItem}
              keyExtractor={item => item.code}
              style={styles.languageList}
            />
            <TouchableOpacity
              accessible={true}
              accessibilityLabel={t('common.close', {defaultValue: 'Chiudi'})}
              accessibilityRole="button"
              style={[styles.closeButton, {backgroundColor: theme.colors.border}]}
              onPress={() => setModalVisible(false)}>
              <Text style={[styles.closeButtonText, {color: theme.colors.text}]}>
                {t('common.close', {defaultValue: 'Chiudi'})}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageList: {
    marginBottom: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  flagText: {
    fontSize: 28,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LanguageSelector;
