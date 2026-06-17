/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import {getMessaging, setBackgroundMessageHandler} from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';
import {emit} from './src/services/notifications/notificationEvents';

if (!__DEV__) {
  console.log = () => {};
}

const messaging = getMessaging();

// Register the background handler BEFORE AppRegistry. The OS calls this handler
// when a push wakes the app from a killed/background state. We just hand off the
// payload to the in-process event bus; NotificationService will navigate once
// it has been initialized by App.js.
setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  emit('tap', {
    sessionId: remoteMessage?.data?.sessionId,
    broadcasterId: remoteMessage?.data?.broadcasterId || '',
  });
  return Promise.resolve();
});

AppRegistry.registerComponent(appName, () => App);
