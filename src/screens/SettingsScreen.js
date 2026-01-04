import React from 'react';
import {View, Text, StyleSheet, Switch} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';

const SettingsScreen = () => {
  const {theme, isDark, toggleDarkMode} = useTheme();
  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.text, {color: theme.colors.text}]}>⚙️ Impostazioni</Text>
      <View style={styles.row}>
        <Text style={[styles.label, {color: theme.colors.text}]}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleDarkMode} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 20},
  text: {fontSize: 24, fontWeight: 'bold', marginBottom: 20},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10},
  label: {fontSize: 16},
});

export default SettingsScreen;
