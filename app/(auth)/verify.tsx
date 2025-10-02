import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, Alert, Image } from 'react-native';
import ScreenTransition from '../../src/components/ui/ScreenTransition';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/Header';
import { verifyAuthCode } from '../../src/store/authSlice';
import { fetchUserProfile } from '../../src/store/userSlice';
import type { AppDispatch, RootState } from '../../src/store';
import { useNotifications } from '../../src/hooks/useNotifications';
import { logger } from '../../src/utils/logger';
import { notificationsService } from '../../src/services/notifications';

export default function Verify() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const authState = useSelector((state: any) => state?.auth);
  const loading = authState?.loading ?? false;
  const error = authState?.error ?? null;
  const phone = (authState?.phone as string | null) ?? (params?.phone as string | undefined) ?? null;
  const isRegistered = authState?.isRegistered ?? false;
  
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '']); // 5 цифр згідно з бекендом
  const refs = digits.map(() => useRef<TextInput>(null));

  const { permission, requestPermissions } = useNotifications();

  // Не робимо автоматичний редирект на логін, щоб не збивати потік введення коду
  // Якщо номер відсутній, користувач все одно може ввести код, а далі ми визначимо куди йти

  useEffect(() => {
    // Перевіряємо чи є збережений код з пушу
    const checkStoredAuthCode = async () => {
      try {
        const storedCode = await notificationsService.getStoredAuthCode();
        if (storedCode && storedCode.length === 5) {
          // Автоматично заповнюємо поля кодом з пушу
          const codeDigits = storedCode.split('');
          setDigits(codeDigits);
          
          // Показуємо повідомлення про автоматичне заповнення
          Alert.alert(
            'Код отримано',
            'Код авторизації автоматично заповнено з push-повідомлення. Натисніть "Перевірити" для продовження.',
            [{ text: 'OK' }]
          );
          
          // Очищаємо збережений код
          await notificationsService.clearStoredAuthCode();
        }
      } catch (error) {
        console.error('Error checking stored auth code:', error);
      }
    };

    checkStoredAuthCode();
  }, []);

  const onChangeDigit = (idx: number, val: string) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    
    if (v && idx < refs.length - 1) {
      refs[idx + 1].current?.focus();
    }
  };

  const onKeyPress = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const submit = async () => {
    const code = digits.join('');
    if (code.length === 5 && phone) {
      try {
        const result = await dispatch(verifyAuthCode({ phone, code })).unwrap();
        
        // Перевіряємо результат верифікації
        logger.info('Verify code result:', result);
        
        if (result.success) {
          // Після успішної верифікації підвантажуємо профіль і вирішуємо куди йти
          try {
            const profile = await dispatch(fetchUserProfile()).unwrap();
            const hasName = Boolean(profile?.fullName && String(profile.fullName).trim().length > 0);
            if (hasName) {
              logger.info('Navigating to home (profile has fullName)');
              router.replace('/(main)/home');
            } else {
              logger.info('Navigating to name (profile missing fullName)');
              router.replace(`/(auth)/name?phone=${encodeURIComponent(phone)}`);
            }
          } catch {
            // Fallback на попередню логіку, якщо профіль не підтягнувся
            if (isRegistered === false) {
              router.replace(`/(auth)/name?phone=${encodeURIComponent(phone)}`);
            } else {
              router.replace('/(main)/home');
            }
          }
        }
      } catch (err) {
        // Помилка вже оброблена в slice
      }
    }
  };

  return (
    <ScreenTransition style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <Header />

      <View style={{ 
        marginTop: 79,
        marginLeft: 10,
        paddingHorizontal: 24, 
        paddingBottom: 50, 
        backgroundColor: '#F5F5F5'
      }}>
        <TouchableOpacity 
          onPress={() => ((router as any).canGoBack && (router as any).canGoBack()) ? router.back() : router.replace('/(auth)/login')} 
          disabled={loading}
          style={{ marginBottom: 45, marginTop: 10 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Image
                source={require('../../assets/images/arrow.png')}
                style={{ width: 11, height: 10 }}
                resizeMode="cover"
              />
            </View>
            <Text style={{ color: '#6B7280' }}>Назад</Text>
          </View>
        </TouchableOpacity>

        <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 20, fontWeight: '500', marginBottom: 15, marginLeft: 10 }}>
          Введіть код з повідомлення
        </Text>

        {/* Блок попередження про дозвіл сповіщень прибрано за вимогою */}

        {!!error && (
          <View style={{ backgroundColor: 'rgba(255,212,212,1)', borderRadius: 10, width: 310, height: 30, marginBottom: 19, marginLeft: 10, alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../../assets/images/icons/not.png')} style={{ width: 11, height: 13, marginRight: 12, tintColor: '#D14F4F' }} />
              <Text style={{ color: '#111', fontSize: 12 }}>Код невірний</Text>
            </View>
          </View>
        )}

        {!error && (
          <View style={{ backgroundColor: 'rgba(216,254,231,1)', borderRadius: 10, marginTop: 15, marginBottom: 19, marginLeft: 10, width: 310, height: 34, paddingHorizontal: 12, alignItems: 'flex-start', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../../assets/images/ring.png')} style={{ width: 11, height: 13, marginRight: 12 }} />
              <Text style={{ color: '#111', fontSize: 12 }}>
                Перевірте панель сповіщень — ми надіслали код.
              </Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 19, marginLeft: 10 }}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={refs[i]}
              value={d}
              onChangeText={(v) => onChangeDigit(i, v)}
              onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!loading}
              style={{
                width: 58,
                height: 51,
                borderRadius: 12,
                backgroundColor: 'rgba(238,238,238,1)',
                borderWidth: 0,
                marginRight: i < digits.length - 1 ? 5 : 0,
                textAlign: 'center',
                fontSize: 20
              }}
            />
          ))}
        </View>

        {/* Прибрано текст "Неверный код" під полями */}

        <TouchableOpacity
          onPress={submit}
          disabled={loading || digits.some(d => !d)}
          activeOpacity={0.8}
          style={{
            width: 312,
            height: 53,
            backgroundColor: loading || digits.some(d => !d) ? '#666666' : '#000000',
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10
          }}
        >
          <Text style={{ color: 'rgba(255, 255, 255, 1)', fontSize: 20, fontWeight: '700' }}>
            {loading ? 'Перевірка...' : 'Перевірити'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenTransition>
  );
}