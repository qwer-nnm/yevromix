import axios, { AxiosError } from 'axios';
import NetInfo from '@react-native-community/netinfo';
// import { authService } from '../services/auth'; // Moved to avoid circular dependency
import { logger } from '../utils/logger';
import { API_URL } from '../constants/config';

// Максимальна кількість спроб повторення запиту
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 секунда

// Типи помилок
export enum ApiErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  originalError?: any;
}

// Створюємо інстанс axios з базовими налаштуваннями
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 секунд таймаут
});

// Додаємо токен до всіх запитів
apiClient.interceptors.request.use(async (config) => {
  try {
    const { TokenStorage } = await import('../services/tokenStorage');
    const token = await TokenStorage.getAccessToken();
    
    // Детальне логування для діагностики
    logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    logger.info(`Full URL: ${config.baseURL}${config.url}`);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.info('Token added to request (first 20 chars):', token.substring(0, 20) + '...');
    } else {
      logger.warn('No token available for request');
    }
    
    if (config.params) {
      logger.info('Request params:', config.params);
    }
  } catch (error) {
    logger.error('Error getting access token:', error);
  }
  return config;
});

// Обробляємо помилки авторизації
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Якщо помилка 401 і це не запит на оновлення токена
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Динамічний імпорт для уникнення циклічної залежності
        const { authService } = await import('../services/auth');
        const newToken = await authService.refreshAccessToken();
        if (!newToken) {
          throw new Error('Failed to refresh token');
        }

        // Повторюємо оригінальний запит з новим токеном
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Якщо не вдалося оновити токен - розлогінюємо
        const { authService } = await import('../services/auth');
        await authService.logout();
        throw refreshError;
      }
    }

    // Логування помилок для діагностики
    if (!error.response) {
      logger.error('Network/Timeout error (no response):', error.message);
      logger.error('Request URL:', error.config?.url);
      logger.error('Request timeout:', error.config?.timeout);
      return Promise.reject({ response: { status: 0, data: { message: error.message || 'Мережева помилка' } } });
    }
    
    logger.error(`API Error Response: ${error.response?.status} ${error.config?.url}`);
    logger.error('Error data:', error.response?.data);
    
    return Promise.reject(error);
  }
);