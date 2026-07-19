import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { DataManager } from './dataManager';

import { ShowAlertMessage, popTypes } from './commonFunctions';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

export class NotificationService {
  static currentChatId: string | null = null;

  static setCurrentChatId(id: string | null) {
    this.currentChatId = id;
    console.log('🔔 [NotificationService] currentChatId set to:', id);
  }

  async requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      await this.getToken();
    }
    
    // Request Notifee permission (specifically for Android 13+)
    await notifee.requestPermission();
  }

  async getToken() {
    try {
      let fcmToken = await DataManager.getFcmToken();
      if (!fcmToken) {
        // REQUIRED FOR iOS: Register with APNs before fetching FCM token
        if (Platform.OS === 'ios' && !messaging().isDeviceRegisteredForRemoteMessages) {
          console.log('Registering device for remote messages on iOS...');
          await messaging().registerDeviceForRemoteMessages();
        }

        fcmToken = await messaging().getToken();
        if (fcmToken) {
          console.log('New FCM Token:', fcmToken);
          await DataManager.setFcmToken(fcmToken);
          // Here you would typically send the token to your backend
        }
      } else {
        console.log('Existing FCM Token:', fcmToken);
      }
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  }

  async createNotificationListeners() {
    // Create high-importance channel for Android
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default_channel_id',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    // Foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('A new FCM message arrived in foreground!', JSON.stringify(remoteMessage));
      
      // Check if we are already in the chat with this user
      const senderId = remoteMessage.data?.senderId || remoteMessage.data?.userId || remoteMessage.data?.from;
      if (senderId && NotificationService.currentChatId === senderId) {
        console.log('🤫 [NotificationService] User is already in this chat. Suppressing notification.');
        return;
      }

      if (remoteMessage.notification) {
        const notificationType = remoteMessage.data?.type || 'general';
        // Use a deterministic ID so duplicate FCM messages map to the same notification
        const uniqueId = remoteMessage.messageId || (remoteMessage.data?.messageId as string) || `${notificationType}-${remoteMessage.data?.senderId || Date.now()}`;
        await notifee.displayNotification({
          id: uniqueId,
          title: remoteMessage.notification.title,
          body: remoteMessage.notification.body,
          android: {
            channelId: 'default_channel_id',
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
          },
        });
      }
    });

    // Background/Quit state messages
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
      // Navigate to the specific screen if needed
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
          // Handle initial notification
        }
      });
  }
}

export const notificationService = new NotificationService();
