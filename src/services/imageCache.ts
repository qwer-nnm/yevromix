import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from '../utils/logger';

// Константи для кешування
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 днів
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp'];

interface CacheEntry {
  uri: string;
  size: number;
  timestamp: number;
}

interface CacheInfo {
  totalSize: number;
  entries: { [key: string]: CacheEntry };
}

class ImageCache {
  private cache: { [key: string]: string } = {};
  private readonly cacheDirectory = `${FileSystem.cacheDirectory}images/`;
  private readonly cacheInfoFile = `${FileSystem.cacheDirectory}image_cache_info.json`;
  private cacheInfo: CacheInfo = { totalSize: 0, entries: {} };

  constructor() {
    this.initCache();
  }

  private async initCache() {
    try {
      // Створюємо директорію кешу
      const { exists } = await FileSystem.getInfoAsync(this.cacheDirectory);
      if (!exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
      }

      // Завантажуємо інформацію про кеш
      await this.loadCacheInfo();

      // Очищаємо старі файли
      await this.cleanupCache();
    } catch (error) {
      logger.error('Error initializing image cache:', error);
    }
  }

  private async loadCacheInfo() {
    try {
      const { exists } = await FileSystem.getInfoAsync(this.cacheInfoFile);
      if (exists) {
        const content = await FileSystem.readAsStringAsync(this.cacheInfoFile);
        this.cacheInfo = JSON.parse(content);
      }
    } catch (error) {
      logger.error('Error loading cache info:', error);
    }
  }

  private async saveCacheInfo() {
    try {
      await FileSystem.writeAsStringAsync(
        this.cacheInfoFile,
        JSON.stringify(this.cacheInfo)
      );
    } catch (error) {
      logger.error('Error saving cache info:', error);
    }
  }

  private getFileExtension(url: string): string {
    const match = url.match(/\.([^.]+)$/);
    return (match ? match[1].toLowerCase() : 'jpg');
  }

  private getCacheKey(url: string): string {
    const ext = this.getFileExtension(url);
    const hash = url.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${Math.abs(hash)}.${ext}`;
  }

  private async cleanupCache() {
    try {
      const now = Date.now();
      const entries = Object.entries(this.cacheInfo.entries);

      // Сортуємо за часом останнього доступу
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

      for (const [key, entry] of entries) {
        // Видаляємо старі файли
        if (now - entry.timestamp > MAX_CACHE_AGE) {
          await this.removeCacheEntry(key);
          continue;
        }

        // Видаляємо файли якщо перевищено розмір кешу
        if (this.cacheInfo.totalSize > MAX_CACHE_SIZE) {
          await this.removeCacheEntry(key);
        } else {
          break;
        }
      }

      await this.saveCacheInfo();
    } catch (error) {
      logger.error('Error cleaning up cache:', error);
    }
  }

  private async removeCacheEntry(key: string) {
    try {
      const entry = this.cacheInfo.entries[key];
      if (entry) {
        await FileSystem.deleteAsync(entry.uri, { idempotent: true });
        this.cacheInfo.totalSize -= entry.size;
        delete this.cacheInfo.entries[key];
        delete this.cache[key];
      }
    } catch (error) {
      logger.error('Error removing cache entry:', error);
    }
  }

  private async optimizeImage(uri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }], // Максимальна ширина 1200px
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      logger.error('Error optimizing image:', error);
      return uri;
    }
  }

  async getCachedImage(url: string): Promise<string> {
    if (!url) return url;

    // Перевіряємо тип файлу
    const ext = this.getFileExtension(url);
    if (!ALLOWED_IMAGE_TYPES.includes(ext)) {
      logger.warn(`Unsupported image type: ${ext}`);
      return url;
    }

    const key = this.getCacheKey(url);
    
    // Перевіряємо чи є в пам'яті
    if (this.cache[key]) {
      // Оновлюємо час останнього доступу
      if (this.cacheInfo.entries[key]) {
        this.cacheInfo.entries[key].timestamp = Date.now();
        this.saveCacheInfo();
      }
      return this.cache[key];
    }

    const filePath = this.cacheDirectory + key;

    try {
      // Перевіряємо чи є на диску
      const { exists, size } = await FileSystem.getInfoAsync(filePath);
      
      if (exists) {
        this.cache[key] = filePath;
        // Оновлюємо інформацію про кеш
        this.cacheInfo.entries[key] = {
          uri: filePath,
          size: size || 0,
          timestamp: Date.now()
        };
        await this.saveCacheInfo();
        return filePath;
      }

      // Завантажуємо зображення
      const { uri } = await FileSystem.downloadAsync(url, filePath);
      
      // Оптимізуємо зображення
      const optimizedUri = await this.optimizeImage(uri);
      
      // Отримуємо розмір файлу
      const { size: fileSize } = await FileSystem.getInfoAsync(optimizedUri);
      
      // Перевіряємо чи є місце в кеші
      if (this.cacheInfo.totalSize + (fileSize || 0) > MAX_CACHE_SIZE) {
        await this.cleanupCache();
      }

      // Зберігаємо в кеш
      this.cache[key] = optimizedUri;
      this.cacheInfo.entries[key] = {
        uri: optimizedUri,
        size: fileSize || 0,
        timestamp: Date.now()
      };
      this.cacheInfo.totalSize += fileSize || 0;
      
      await this.saveCacheInfo();
      return optimizedUri;
    } catch (error) {
      logger.error('Error caching image:', error);
      return url;
    }
  }

  async clearCache() {
    try {
      await FileSystem.deleteAsync(this.cacheDirectory, { idempotent: true });
      await FileSystem.deleteAsync(this.cacheInfoFile, { idempotent: true });
      await this.initCache();
      this.cache = {};
      this.cacheInfo = { totalSize: 0, entries: {} };
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  async getCacheStats() {
    return {
      totalSize: this.cacheInfo.totalSize,
      fileCount: Object.keys(this.cacheInfo.entries).length,
      maxSize: MAX_CACHE_SIZE
    };
  }
}

export const imageCache = new ImageCache();