// Custom entry: expo-router's own entry plus the headless task Android runs
// to file detected payments while the app is closed. Registered here because
// AppRegistry needs it before any React context exists — a headless start
// boots the bundle straight into the task, never through a screen.
import 'expo-router/entry';
import { AppRegistry } from 'react-native';
import { AUTO_FILE_TASK, autoFileTask } from './src/services/autoFileTask';

AppRegistry.registerHeadlessTask(AUTO_FILE_TASK, () => autoFileTask);
