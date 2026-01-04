import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';

const AboutScreen = () => {
  const {theme} = useTheme();
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>🃏 Segnapunti</Text>
      <Text style={[styles.version, {color: theme.colors.textSecondary}]}>v1.3.0</Text>
      <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
        L'app segnapunti definitiva per ogni gioco
      </Text>
      <Text style={[styles.footer, {color: theme.colors.textSecondary}]}>
        Fatto con ❤️ da TNT Labs
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20},
  title: {fontSize: 32, fontWeight: 'bold', marginBottom: 10},
  version: {fontSize: 16, marginBottom: 20},
  subtitle: {fontSize: 16, textAlign: 'center', marginBottom: 40},
  footer: {fontSize: 14, position: 'absolute', bottom: 30},
});

export default AboutScreen;
