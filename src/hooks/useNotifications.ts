import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { logger } from '../utils/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);

  // Запит дозволу на пуші
  const requestPermissions = async () => {
    try {
      // Перевіряємо, чи це Expo Go
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (isExpoGo) {
        logger.warn('Push notifications are not supported in Expo Go for SDK 53+');
        setPermission(false);
        // Повертаємо mock токен для тестування
        const mockToken = 'ExponentPushToken[mock-token-for-expo-go]';
        setExpoPushToken(mockToken);
        return mockToken;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('Failed to get push token for push notification!');
        setPermission(false);
        return null;
      }

      setPermission(true);

      // Отримуємо токен тільки якщо є дозвіл
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const token = await Notifications.getExpoPushTokenAsync();

      setExpoPushToken(token.data);
      return token.data;
    } catch (error) {
      logger.error('Error requesting notification permissions:', error);
      setPermission(false);
      return null;
    }
  };

  // Обробка вхідних пушів
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      
      // Якщо це пуш з кодом авторизації
      if (data?.type === 'auth_code') {
        const code = data?.code || data?.authCode || body?.match?.(/\b\d{5}\b/)?.[0] || body?.match?.(/\b\d{6}\b/)?.[0] || null;
        logger.info('Auth code push received:', { title, body, code, data });
        if (code) {
          console.log(`\n🔑 Код з пуша: ${code}`);
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return {
    expoPushToken,
    permission,
    requestPermissions
  };
}