import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity, Animated, Alert } from 'react-native';
import ScreenTransition from '../../src/components/ui/ScreenTransition';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/Header';
import { requestAuthCode, validatePhone } from '../../src/store/authSlice';
import type { AppDispatch, RootState } from '../../src/store';
import { useNotifications } from '../../src/hooks/useNotifications';
import { logger } from '../../src/utils/logger';
import { notificationsService } from '../../src/services/notifications';

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: any) => state?.auth);
  const loading = authState?.loading ?? false;
  const error = authState?.error ?? null;
  
  const [phone, setPhone] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { expoPushToken, permission, requestPermissions } = useNotifications();

  const handlePhoneChange = (value: string) => {
    // Автоматично додаємо +380 якщо користувач почав вводити цифри
    if (value.length > 0 && !value.startsWith('+')) {
      value = '+380' + value;
    }
    
    // Видаляємо всі символи крім + та цифр
    value = value.replace(/[^\+\d]/g, '');
    
    setPhone(value);
    setValidationError(null);
  };

  // Запитуємо дозвіл на пуші при монтуванні
  useEffect(() => {
    if (permission === null) {
      requestPermissions();
    }
  }, []);

  const handleSubmit = async () => {
    if (!validatePhone(phone)) {
      setValidationError('Номер телефону має починатися з +380 та містити 12 цифр');
      return;
    }

    // Запитуємо дозвіл на пуші та реєструємо токен
    try {
      const enabled = await notificationsService.enable();
      if (!enabled) {
        Alert.alert(
          'Увага',
          'Для отримання коду авторизації потрібен дозвіл на push-повідомлення. Будь ласка, надайте дозвіл у налаштуваннях.',
          [{ text: 'OK' }]
        );
        return;
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      Alert.alert(
        'Помилка',
        'Не вдалося налаштувати push-повідомлення. Спробуйте ще раз.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const pushToken = notificationsService.currentToken;
      logger.info('Requesting auth code', { phone, pushToken });
      
      const result = await dispatch(requestAuthCode({ 
        phone, 
        pushToken: pushToken || 'temporary_push_token' 
      })).unwrap();
      
      logger.info('Auth code request result', result);
      
      if (result.success) {
        // очищаємо можливі попередні помилки авторизації
        setValidationError(null);
        logger.info('Navigating to verify screen');
        router.replace(`/(auth)/verify?phone=${encodeURIComponent(phone)}`);
      } else {
        logger.error('Auth code request failed', { message: result.message });
        setValidationError(result.message || 'Помилка відправки коду');
      }
    } catch (err: any) {
      logger.error('Auth code request error', err);
      setValidationError(err.message || 'Помилка відправки коду');
    }
  };

  return (
    <ScreenTransition style={{ flex: 1,  }}>
      <Header />

      <View style={{ 
        marginTop: 79,
        marginLeft: 10,
        paddingHorizontal: 24, 
        paddingBottom: 50, 
        
      }}>
        <Text style={{ color: 'rgba(132, 132, 127, 1)', fontSize: 14, marginBottom: 12, marginLeft: 10 }}>
          Раді знову вас бачити
        </Text>
        <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 24, fontWeight: '700', marginBottom: 16, marginLeft: 10 }}>
          Введіть ваш номер
        </Text>

        <TextInput
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="+380"
          keyboardType="phone-pad"
          editable={!loading}
          style={{ 
            width: 312,
            height: 53,
            borderWidth: 1,
            borderColor: validationError ? '#EF4444' : 'rgba(197, 197, 197, 1)',
            padding: 14,
            borderRadius: 16,
            backgroundColor: 'rgba(238, 238, 238, 1)',
            fontSize: 16,
            marginLeft: 10,
            marginTop: 15,
           
          }}
        />

        {(validationError || error) && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 10 }}>
            {validationError || error}
          </Text>
        )}

        <View style={{ height: 16 }} />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            width: 312,
            height: 53,
            backgroundColor: loading ? '#666666' : 'rgba(0, 0, 0, 1)',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10
          }}
        >
          <Text style={{ color: 'rgba(255, 255, 255, 1)', fontSize: 20, fontWeight: '600' }}>
            {loading ? 'Зачекайте...' : 'Далі'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenTransition>
  );
}