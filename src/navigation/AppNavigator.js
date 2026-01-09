import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../contexts/ThemeContext';

// Screens (da implementare)
import GameScreen from '../screens/GameScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PresetManagerScreen from '../screens/PresetManagerScreen';
import AboutScreen from '../screens/AboutScreen';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const {theme} = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: theme.dark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
        },
      }}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused, color, size}) => {
            let iconName;

            switch (route.name) {
              case 'Game':
                iconName = 'cards-playing';
                break;
              case 'History':
                iconName = 'history';
                break;
              case 'Settings':
                iconName = 'cog';
                break;
              case 'Presets':
                iconName = 'gamepad-variant';
                break;
              case 'About':
                iconName = 'information';
                break;
              default:
                iconName = 'circle';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
        })}>
        <Tab.Screen
          name="Game"
          component={GameScreen}
          options={{title: 'Partita'}}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{title: 'Storico'}}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{title: 'Impostazioni'}}
        />
        <Tab.Screen
          name="Presets"
          component={PresetManagerScreen}
          options={{title: 'Preset'}}
        />
        <Tab.Screen
          name="About"
          component={AboutScreen}
          options={{title: 'Info'}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
