/**
 * @format
 */

// MUST be the very first import - required by react-native-gesture-handler
import 'react-native-gesture-handler';

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
