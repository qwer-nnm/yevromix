import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
import ScreenTransition from '../../src/components/ui/ScreenTransition';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/Header';
import { completeUserRegistration } from '../../src/store/authSlice';
import type { AppDispatch, RootState } from '../../src/store';

export default function Name() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: any) => state?.auth);
  const loading = authState?.loading ?? false;
  const error = authState?.error ?? null;
  const phone = authState?.phone ?? null;
  const params = useLocalSearchParams();
  const phoneParam = (params?.phone as string | undefined) ?? null;
  const safePhone = phone ?? phoneParam;
  
  const [fullName, setFullName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    // Якщо немає номера телефону, повертаємось на екран логіну
    if (!safePhone) {
      router.replace('/(auth)/login');
    }
  }, [safePhone]);

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2; // Мінімум 2 символи
  };

  const handleSubmit = async () => {
    if (!validateName(fullName)) {
      setValidationError("Ім'я має містити мінімум 2 символи");
      return;
    }

    try {
      if (safePhone) {
        await dispatch(completeUserRegistration({ phone: safePhone, fullName })).unwrap();
        router.replace('/(main)/home');
      }
    } catch (err) {
      // Помилка вже оброблена в slice
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
          <Text style={{ color: '#6B7280' }}>← Назад</Text>
        </TouchableOpacity>

        <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 24, fontWeight: '700', marginBottom: 14, marginLeft: 10 }}>
        Введіть ваше ім’я та прізвище
        </Text>

       

        <TextInput
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            setValidationError(null);
          }}
          placeholder="Ваше ім'я"
          editable={!loading}
          style={{
            width: 312,
            height: 53,
            borderWidth: 1,
            borderColor: validationError || error ? '#EF4444' : 'rgba(197, 197, 197, 1)',
            padding: 14,
            borderRadius: 16,
            backgroundColor: 'rgba(238, 238, 238, 1)',
            fontSize: 16,
            marginLeft: 10
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
          disabled={loading || !fullName.trim()}
          activeOpacity={0.8}
          style={{
            width: 312,
            height: 53,
            backgroundColor: loading || !fullName.trim() ? '#666666' : 'rgba(0, 0, 0, 1)',
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