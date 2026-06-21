
import 'react-native-gesture-handler'; // must be first
import React from "react";
import { AppRegistry, StyleSheet } from "react-native";
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  // On Android, if the message contains a 'notification' object, 
  // Firebase will automatically display a notification when the app is in the background.
  // We don't need to call notifee.displayNotification here unless we are using data-only messages.
});

// Register Notifee foreground service for background calls (camera/mic survival)
notifee.registerForegroundService((notification) => {
  return new Promise(() => {
    // Long running task for foreground service
  });
});
import { Provider } from "react-redux";
import { SafeAreaProvider } from 'react-native-safe-area-context';

import App from "./App";
import { name as appName } from "./app.json";
import store, { persistor } from "./src/redux/store";
import { PersistGate } from "redux-persist/integration/react";

const Root = () => (
  <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
});

AppRegistry.registerComponent(appName, () => Root);