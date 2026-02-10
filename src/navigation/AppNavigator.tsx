import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../contexts/ThemeContext';

// Screens
import GameScreen from '../screens/GameScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PresetManagerScreen from '../screens/PresetManagerScreen';
import AboutScreen from '../screens/AboutScreen';

// Define tab param list
export type TabParamList = {
  Game: undefined;
  History: undefined;
  Settings: {selectedPreset?: import('../constants/presets').GamePreset} | undefined;
  Presets: undefined;
  About: undefined;
};

// Screen props types
export type GameScreenProps = BottomTabScreenProps<TabParamList, 'Game'>;
export type HistoryScreenProps = BottomTabScreenProps<TabParamList, 'History'>;
export type SettingsScreenProps = BottomTabScreenProps<TabParamList, 'Settings'>;
export type PresetsScreenProps = BottomTabScreenProps<TabParamList, 'Presets'>;
export type AboutScreenProps = BottomTabScreenProps<TabParamList, 'About'>;

const Tab = createBottomTabNavigator<TabParamList>();

const AppNavigator: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();

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
          notification: theme.colors.primary,
        },
      }}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({color, size}) => {
            let iconName: string;

            switch (route.name) {
              case 'Game':
                iconName = 'cards-playing';
                break;
              case 'History':
                iconName = 'history';
                break;
              case 'Settings':
                iconName = 'plus-circle';
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
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: theme.colors.primary,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.2,
            shadowRadius: 4,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        })}>
        <Tab.Screen
          name="Game"
          component={GameScreen}
          options={{title: t('nav.game')}}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{title: t('nav.newGame')}}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{title: t('nav.history')}}
        />
        <Tab.Screen
          name="Presets"
          component={PresetManagerScreen}
          options={{title: t('nav.presets')}}
        />
        <Tab.Screen
          name="About"
          component={AboutScreen}
          options={{title: t('nav.about')}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
