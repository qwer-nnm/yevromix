import { refreshToken as refreshTokenApi } from '../api/auth';
import { TokenStorage } from './tokenStorage';
import { logger } from '../utils/logger';

class AuthService {
  private refreshPromise: Promise<string> | null = null;

  async init() {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        TokenStorage.getAccessToken(),
        TokenStorage.getRefreshToken()
      ]);
      
      return Boolean(accessToken && refreshToken);
    } catch (error) {
      logger.error('Error initializing auth service:', error);
      return false;
    }
  }

  async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await TokenStorage.setTokens(accessToken, refreshToken);
      logger.debug('Tokens saved successfully');
    } catch (error) {
      logger.error('Error saving tokens:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await TokenStorage.getAccessToken();
    } catch (error) {
      logger.error('Error getting access token:', error);
      return null;
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      // Запобігаємо паралельним запитам на оновлення токена
      if (this.refreshPromise) {
        return this.refreshPromise;
      }

      this.refreshPromise = (async () => {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await refreshTokenApi(refreshToken);
        const newAccessToken = response.data.accessToken;
        
        await TokenStorage.setTokens(newAccessToken, refreshToken);
        return newAccessToken;
      })();

      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      logger.error('Error refreshing access token:', error);
      await this.logout();
      return null;
    }
  }

  async logout() {
    try {
      await TokenStorage.clearTokens();
      // Динамічні імпорти для уникнення циклічних залежностей
      const [{ store }, authSliceModule, userSliceModule] = await Promise.all([
        import('../store'),
        import('../store/authSlice'),
        import('../store/userSlice'),
      ]);
      const { resetAuth } = authSliceModule as any;
      const { clearUser } = userSliceModule as any;
      store.dispatch(resetAuth());
      store.dispatch(clearUser());
      logger.debug('Logout successful');
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();