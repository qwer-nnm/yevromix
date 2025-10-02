import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/crypto';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_VERSION_KEY = 'token_version';

// Версія токена для можливості оновлення формату в майбутньому
const CURRENT_TOKEN_VERSION = '1';

interface TokenMetadata {
  value: string;
  created: number;
  deviceId: string;
}

class TokenStorageService {
  private deviceId: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Стартуємо ініціалізацію, але також гарантуємо очікування при зверненнях
    this.initDeviceId();
  }

  private async initDeviceId(): Promise<void> {
    if (this.deviceId) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Отримуємо або генеруємо унікальний ID пристрою
        let deviceId = await SecureStore.getItemAsync('device_id');
        if (!deviceId) {
          deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
          await SecureStore.setItemAsync('device_id', deviceId);
        }
        this.deviceId = deviceId;
      } catch (error) {
        logger.error('Error initializing device ID:', error);
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  private async ensureInitialized() {
    if (!this.deviceId) {
      await this.initDeviceId();
    }
  }

  private async encryptToken(token: string): Promise<string> {
    await this.ensureInitialized();
    if (!this.deviceId) {
      throw new Error('Device ID not initialized');
    }

    const metadata: TokenMetadata = {
      value: token,
      created: Date.now(),
      deviceId: this.deviceId
    };

    return encrypt(JSON.stringify(metadata));
  }

  private async decryptToken(encryptedToken: string): Promise<string | null> {
    try {
      await this.ensureInitialized();
      if (!this.deviceId) {
        throw new Error('Device ID not initialized');
      }

      const decrypted = await decrypt(encryptedToken);
      const metadata: TokenMetadata = JSON.parse(decrypted);

      // Перевіряємо чи токен з цього пристрою
      if (metadata.deviceId !== this.deviceId) {
        logger.warn('Token from different device detected');
        await this.clearTokens();
        return null;
      }

      return metadata.value;
    } catch (error) {
      logger.error('Error decrypting token:', error);
      return null;
    }
  }

  async setTokens(accessToken: string, refreshToken: string) {
    try {
      const encryptedAccess = await this.encryptToken(accessToken);
      const encryptedRefresh = await this.encryptToken(refreshToken);

      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, encryptedAccess),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, encryptedRefresh),
        SecureStore.setItemAsync(TOKEN_VERSION_KEY, CURRENT_TOKEN_VERSION)
      ]);

      logger.debug('Tokens successfully saved');
    } catch (error) {
      logger.error('Error saving tokens:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      await this.ensureInitialized();
      const encryptedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!encryptedToken) return null;

      return this.decryptToken(encryptedToken);
    } catch (error) {
      logger.error('Error getting access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      await this.ensureInitialized();
      const encryptedToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!encryptedToken) return null;

      return this.decryptToken(encryptedToken);
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      return null;
    }
  }

  async clearTokens() {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(TOKEN_VERSION_KEY)
      ]);

      logger.debug('Tokens successfully cleared');
    } catch (error) {
      logger.error('Error clearing tokens:', error);
      throw error;
    }
  }

  async isTokenVersionValid(): Promise<boolean> {
    try {
      const version = await SecureStore.getItemAsync(TOKEN_VERSION_KEY);
      return version === CURRENT_TOKEN_VERSION;
    } catch (error) {
      logger.error('Error checking token version:', error);
      return false;
    }
  }
}

export const TokenStorage = new TokenStorageService();
