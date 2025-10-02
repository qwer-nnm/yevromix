import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { updatePushToken } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = '@push_token';

// Конфігурація Firebase (замініть на свою)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

class FirebaseService {
  private app = initializeApp(firebaseConfig);
  private messaging = getMessaging(this.app);

  async init() {
    try {
      // Запитуємо дозвіл на push-повідомлення
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      // Отримуємо токен
      const currentToken = await this.getFCMToken();
      if (currentToken) {
        await this.updateToken(currentToken);
      }

      // Підписуємось на оновлення токена
      this.setupTokenRefresh();
      
      // Налаштовуємо обробку повідомлень
      this.setupMessageHandler();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }

  private async getFCMToken(): Promise<string | null> {
    try {
      const token = await getToken(this.messaging);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  private async updateToken(newToken: string) {
    try {
      const oldToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      
      // Оновлюємо токен тільки якщо він змінився
      if (newToken !== oldToken) {
        await updatePushToken({ pushToken: newToken });
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, newToken);
      }
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  }

  private setupTokenRefresh() {
    // Підписуємось на оновлення токена
    this.messaging.onTokenRefresh(async () => {
      const newToken = await this.getFCMToken();
      if (newToken) {
        await this.updateToken(newToken);
      }
    });
  }

  private setupMessageHandler() {
    // Обробка повідомлень коли додаток відкритий
    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      
      // Тут можна додати логіку показу нотифікацій
      if (payload.notification) {
        const { title, body } = payload.notification;
        // Показуємо нотифікацію
      }
    });
  }
}

export const firebaseService = new FirebaseService();