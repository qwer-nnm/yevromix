import { apiClient } from './base';
import { User } from './user';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RequestCodeResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  isRegistered: boolean;
  user: User | null;
  code?: string; // Код буде доступний тільки в режимі розробки
}

interface VerifyCodeResponse {
  success: boolean;
  token: string;
  refreshToken: string; // Додаємо refreshToken
  user: User;
}

interface CompleteRegistrationResponse {
  success: boolean;
  message: string;
  user: User;
}

interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
}

export const requestCode = async (phone: string, pushToken: string) => {
  try {
    const response = await apiClient.post<RequestCodeResponse>('/api/auth/request-code', { phone, pushToken });
    
    // В режимі розробки генеруємо тестовий код
    if (__DEV__ && response.data.success) {
      // Генеруємо 5-значний код (узгоджено з бекендом)
      const testCode = Math.floor(10000 + Math.random() * 90000).toString();
      console.log('\n🔑 Код авторизації для тестування (5-значний):', testCode);
      console.log('📱 Введіть цей код на екрані верифікації');
      
      // Зберігаємо код в AsyncStorage для подальшої верифікації
      await AsyncStorage.setItem(`auth_code_${phone}`, testCode);
    }
    
    return response;
  } catch (error) {
    // Якщо API недоступний, в режимі розробки створюємо mock відповідь
    if (__DEV__) {
      const testCode = Math.floor(10000 + Math.random() * 90000).toString();
      console.log('\n🔑 Код авторизації для тестування (mock, 5-значний):', testCode);
      console.log('📱 Введіть цей код на екрані верифікації');
      
      await AsyncStorage.setItem(`auth_code_${phone}`, testCode);
      
      return {
        data: {
          success: true,
          message: 'Код відправлено (режим розробки)',
          expiresIn: 300,
          isRegistered: false,
          user: null
        }
      };
    }
    throw error;
  }
};

export const verifyCode = async (phone: string, code: string) => {
  // В режимі розробки перевіряємо код з AsyncStorage
  if (__DEV__) {
    const storedCode = await AsyncStorage.getItem(`auth_code_${phone}`);
    if (storedCode && storedCode === code) {
      // Якщо код співпадає, імітуємо відповідь для НОВОГО користувача (без fullName)
      return {
        data: {
          success: true,
          token: 'dev_test_token',
          refreshToken: 'dev_test_refresh_token',
          user: {
            id: 1,
            phone,
            fullName: '', // Порожнє ім'я для нового користувача
            cardNumber: '1234567890',
            birthDate: null,
            email: null,
            address: null,
            isVerified: false // Не верифікований до завершення реєстрації
          }
        }
      };
    }
  }

  // В production або якщо тестовий код не співпав, робимо реальний запит
  return apiClient.post<VerifyCodeResponse>('/api/auth/verify-code', { phone, code });
};

export const completeRegistration = (phone: string, fullName: string) =>
  apiClient.post<CompleteRegistrationResponse>('/api/user/complete-registration', { phone, fullName });

export const refreshToken = (refreshToken: string) =>
  apiClient.post<RefreshTokenResponse>('/api/auth/refresh', { refreshToken });