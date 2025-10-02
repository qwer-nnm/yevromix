import * as CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import { getItemAsync, setItemAsync } from 'expo-secure-store';
import { logger } from './logger';

const KEY_SIZE = 32; // 256 bits
const IV_SIZE = 16; // 128 bits
const ENCRYPTION_KEY_STORE = 'encryption_key';

// Функція для отримання ключа шифрування
async function getEncryptionKey(): Promise<string> {
  try {
    // Спробуємо отримати існуючий ключ
    let key = await getItemAsync(ENCRYPTION_KEY_STORE);
    
    if (!key) {
      // Генеруємо новий ключ якщо не існує
      const randomBytes = await Crypto.getRandomBytesAsync(KEY_SIZE);
      key = Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Зберігаємо ключ
      await setItemAsync(ENCRYPTION_KEY_STORE, key);
    }
    
    return key;
  } catch (error) {
    logger.error('Error getting encryption key:', error);
    throw error;
  }
}

// Шифрування даних
export async function encrypt(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    
    // Генеруємо випадковий IV
    const iv = await Crypto.getRandomBytesAsync(IV_SIZE);
    const ivHex = Array.from(iv)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Шифруємо дані
    const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Hex.parse(key), {
      iv: CryptoJS.enc.Hex.parse(ivHex),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    // Повертаємо IV + зашифровані дані
    return ivHex + encrypted.toString();
  } catch (error) {
    logger.error('Error encrypting data:', error);
    throw error;
  }
}

// Розшифрування даних
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    
    // Виділяємо IV та зашифровані дані
    const ivHex = encryptedData.slice(0, IV_SIZE * 2);
    const encrypted = encryptedData.slice(IV_SIZE * 2);
    
    // Розшифровуємо
    const decrypted = CryptoJS.AES.decrypt(encrypted, CryptoJS.enc.Hex.parse(key), {
      iv: CryptoJS.enc.Hex.parse(ivHex),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    logger.error('Error decrypting data:', error);
    throw error;
  }
}
