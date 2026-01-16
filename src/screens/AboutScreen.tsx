import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking, Alert} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AdBanner from '../components/AdBanner';
import {AD_UNITS, AD_BANNER_SIZES} from '../config/adConfig';
import type {AboutScreenProps} from '../navigation/AppNavigator';

const AboutScreen: React.FC<AboutScreenProps> = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const handlePrivacyPolicy = (): void => {
    const privacyUrl = 'https://tnt-labs.github.io/Segnapunti/privacy-policy.html';
    Linking.openURL(privacyUrl).catch(err => {
      if (__DEV__) {
        console.error('Errore apertura privacy policy:', err);
      }
      Alert.alert(t('common.error'), t('about.privacyError'));
    });
  };

  const handleTermsOfService = (): void => {
    Alert.alert(
      t('about.termsTitle'),
      t('about.termsMessage'),
      [{text: t('common.ok')}]
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        <Text
          style={[styles.title, {color: theme.colors.text}]}
          accessibilityRole="header">
          {t('about.title')}
        </Text>
        <Text
          style={[styles.version, {color: theme.colors.textSecondary}]}
          accessibilityRole="text"
          accessibilityLabel={t('about.version', {version: '1.0.6'})}>
          v1.0.6
        </Text>
        <Text
          style={[styles.subtitle, {color: theme.colors.textSecondary}]}
          accessibilityRole="text">
          {t('about.subtitle')}
        </Text>

        <View style={styles.linksContainer}>
          <TouchableOpacity
            accessible={true}
            accessibilityLabel={t('about.privacyPolicy')}
            accessibilityHint={t('about.privacyPolicyHint')}
            accessibilityRole="button"
            style={[styles.linkButton, {backgroundColor: theme.colors.card}]}
            onPress={handlePrivacyPolicy}>
            <Icon name="shield-lock" size={24} color={theme.colors.primary} />
            <Text style={[styles.linkText, {color: theme.colors.text}]}>
              {t('about.privacyPolicy')}
            </Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityLabel={t('about.termsOfService')}
            accessibilityHint={t('about.termsOfServiceHint')}
            accessibilityRole="button"
            style={[styles.linkButton, {backgroundColor: theme.colors.card}]}
            onPress={handleTermsOfService}>
            <Icon name="file-document" size={24} color={theme.colors.primary} />
            <Text style={[styles.linkText, {color: theme.colors.text}]}>
              {t('about.termsOfService')}
            </Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <AdBanner
          size={AD_BANNER_SIZES.ABOUT_SCREEN}
          style={styles.adBanner}
          adUnitId={AD_UNITS.ABOUT_SCREEN}
        />

        <Text
          style={[styles.footer, {color: theme.colors.textSecondary}]}
          accessibilityRole="text">
          {t('about.footer')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20},
  content: {width: '100%', maxWidth: 400, alignItems: 'center'},
  title: {fontSize: 32, fontWeight: 'bold', marginBottom: 10},
  version: {fontSize: 16, marginBottom: 20},
  subtitle: {fontSize: 16, textAlign: 'center', marginBottom: 40},
  linksContainer: {width: '100%', marginBottom: 40},
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  linkText: {flex: 1, fontSize: 16, fontWeight: '500', marginLeft: 12},
  adBanner: {marginVertical: 20, width: '100%'},
  footer: {fontSize: 14, marginTop: 20},
});

export default AboutScreen;
