import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updatePushToken } from '../api/user';
import { store } from '../store';
import { fetchNotifications } from '../store/notificationsSlice';

class NotificationsService {
  private pushToken: string | null = null;
  private static readonly STORAGE_KEY = '@notifications_enabled';
  private static readonly AUTH_CODE_KEY = '@auth_code';

  async init() {
    try {
      // Запитуємо дозвіл на push-повідомлення
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permission not granted!');
      }

      // Налаштовуємо обробку повідомлень
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Отримуємо токен
      const token = await this.getToken();
      if (token) {
        await this.updateToken(token);
      }

      // Налаштовуємо глобальні обробники пушів
      this.setupGlobalListeners();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  private setupGlobalListeners() {
    // Обробка пушів коли додаток відкритий
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Push received while app is open:', notification);
      
      // Перевіряємо чи це код авторизації
      const authCode = notification.request?.content?.data?.auth_code as string | undefined;
      if (authCode) {
        console.log('Auth code received via push:', authCode);
        // Зберігаємо код для використання на екрані верифікації
        AsyncStorage.setItem(NotificationsService.AUTH_CODE_KEY, authCode);
      }
      
      // Оновлюємо список сповіщень
      store.dispatch(fetchNotifications({ limit: 20, offset: 0 }));
    });

    // Обробка натискання на пуш
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Push notification tapped:', response);
      
      // Якщо це код авторизації, можемо автоматично перейти на екран верифікації
      const authCode = response.notification.request?.content?.data?.auth_code as string | undefined;
      if (authCode) {
        console.log('Auth code push tapped:', authCode);
        // Код збережено вище, тепер можна використати на екрані верифікації
      }
    });
  }

  private async getToken(): Promise<string | null> {
    try {
      // Отримуємо Expo push token
      const { data: token } = await Notifications.getExpoPushTokenAsync();

      this.pushToken = token;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async updateToken(newToken: string) {
    try {
      await updatePushToken({ pushToken: newToken });
      this.pushToken = newToken;
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  }

  // Обробка повідомлень, коли додаток відкритий
  onNotificationReceived(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Обробка натискання на повідомлення
  onNotificationResponseReceived(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Налаштування для Android
  async setupAndroid() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  // Зберігаємо стан дозволу локально та керуємо реєстрацією токена
  async enable(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(NotificationsService.STORAGE_KEY, 'true');

      // Запитуємо дозволи при увімкненні
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return false;
      }

      await this.setupAndroid();
      
      // Налаштовуємо обробку повідомлень
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      const token = await this.getToken();
      if (token) {
        await this.updateToken(token);
      }

      // Налаштовуємо глобальні обробники пушів
      this.setupGlobalListeners();
      
      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  }

  async disable(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(NotificationsService.STORAGE_KEY, 'false');
      // Локально «вимикаємо»: не реєструємо токен та можемо очистити локальний токен
      this.pushToken = null;
      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return false;
    }
  }

  async isEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(NotificationsService.STORAGE_KEY);
    return value !== 'false'; // за замовчуванням увімкнено, якщо не встановлено
  }

  // Отримуємо поточний токен
  get currentToken(): string | null {
    return this.pushToken;
  }

  // Отримуємо збережений код авторизації
  async getStoredAuthCode(): Promise<string | null> {
    return await AsyncStorage.getItem(NotificationsService.AUTH_CODE_KEY);
  }

  // Очищаємо збережений код після використання
  async clearStoredAuthCode(): Promise<void> {
    await AsyncStorage.removeItem(NotificationsService.AUTH_CODE_KEY);
  }
}

export const notificationsService = new NotificationsService();