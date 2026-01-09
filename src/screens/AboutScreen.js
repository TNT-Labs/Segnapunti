import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking, Alert} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AboutScreen = () => {
  const {theme} = useTheme();

  const handlePrivacyPolicy = () => {
    const privacyUrl = 'https://tnt-labs.github.io/Segnapunti/privacy-policy.html';
    Linking.openURL(privacyUrl).catch(err => {
      console.error('Errore apertura privacy policy:', err);
      Alert.alert('Errore', 'Impossibile aprire la privacy policy.');
    });
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Termini di Servizio',
      'Segnapunti è fornita "così com\'è" senza garanzie di alcun tipo. L\'utilizzo dell\'app è soggetto all\'accettazione della nostra Privacy Policy.',
      [{text: 'OK'}]
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        <Text
          style={[styles.title, {color: theme.colors.text}]}
          accessibilityRole="header">
          🃏 Segnapunti
        </Text>
        <Text
          style={[styles.version, {color: theme.colors.textSecondary}]}
          accessibilityRole="text"
          accessibilityLabel="Versione 1.0.0">
          v1.0.0
        </Text>
        <Text
          style={[styles.subtitle, {color: theme.colors.textSecondary}]}
          accessibilityRole="text">
          L'app segnapunti definitiva per ogni gioco
        </Text>

        <View style={styles.linksContainer}>
          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Privacy Policy"
            accessibilityHint="Apri la privacy policy dell'app"
            accessibilityRole="button"
            style={[styles.linkButton, {backgroundColor: theme.colors.card}]}
            onPress={handlePrivacyPolicy}>
            <Icon name="shield-lock" size={24} color={theme.colors.primary} />
            <Text style={[styles.linkText, {color: theme.colors.text}]}>
              Privacy Policy
            </Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            accessible={true}
            accessibilityLabel="Termini di Servizio"
            accessibilityHint="Visualizza i termini di servizio"
            accessibilityRole="button"
            style={[styles.linkButton, {backgroundColor: theme.colors.card}]}
            onPress={handleTermsOfService}>
            <Icon name="file-document" size={24} color={theme.colors.primary} />
            <Text style={[styles.linkText, {color: theme.colors.text}]}>
              Termini di Servizio
            </Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.footer, {color: theme.colors.textSecondary}]}
          accessibilityRole="text">
          Fatto con ❤️ da TNT Labs
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
  footer: {fontSize: 14, marginTop: 20},
});

export default AboutScreen;
