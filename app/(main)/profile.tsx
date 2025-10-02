import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationsService } from '../../src/services/notifications';
import { useSelector, useDispatch } from 'react-redux';
import TabBar from '../../src/components/ui/TabBar';
import UIInput from '../../src/components/ui/Input';
import UIButton from '../../src/components/ui/Button';
import { colors } from '../../src/constants/colors';
import { selectUser, fetchUserProfile } from '../../src/store/userSlice';
import type { AppDispatch } from '../../src/store';

export default function Profile() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const user = useSelector(selectUser);
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const formatBirthDateFromAny = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    let date: Date | null = null;
    if (typeof value === 'number') {
      const ms = value < 1e12 ? value * 1000 : value; // seconds -> ms
      date = new Date(ms);
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      const numeric = Number(trimmed);
      if (!Number.isNaN(numeric) && trimmed !== '') {
        const ms = numeric < 1e12 ? numeric * 1000 : numeric;
        date = new Date(ms);
      } else {
        date = new Date(trimmed);
      }
    }
    if (!date || Number.isNaN(date.getTime())) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  };
  const [notifications, setNotifications] = useState<boolean>(false);

  // Генеруємо ініціали з імені користувача
  const getInitials = (fullName: string | null | undefined): string => {
    if (!fullName) return 'ГГ'; // Гість Гість за замовчуванням
    
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    } else if (names.length === 1) {
      return (names[0][0] + names[0][1] || names[0][0]).toUpperCase();
    }
    return 'ГГ';
  };

  // Завантажуємо дані користувача при монтуванні
  useEffect(() => {
    if (!user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, user]);

  // Заповнюємо форму даними користувача
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setBirthDate(formatBirthDateFromAny((user as any).birthDate));
    }
  }, [user]);

  // Ініціалізація стану перемикача зі сховища
  useEffect(() => {
    (async () => {
      const enabled = await notificationsService.isEnabled();
      setNotifications(enabled);
    })();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    setNotifications(value);
    if (value) {
      await notificationsService.enable();
    } else {
      await notificationsService.disable();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topInset }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 24, paddingBottom: 120 }}>
        <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)/home'))} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Image
        source={require('../../assets/images/arrow.png')}
        style={{ width: 11, height: 10 }}
        resizeMode="cover"
      />
              </View>
              <Text style={{ color: 'rgba(132,132,127,1)', fontSize: 18, fontWeight: '400' }}>Назад</Text>
            </TouchableOpacity>
        <View style={{ flex: 1 }} />
          <View style={{ width: 39, height: 39, borderRadius: 8, backgroundColor: 'rgba(255, 255, 255, 1)', alignItems: 'center', justifyContent: 'center',borderColor: 'rgba(210, 210, 210, 1)',borderWidth: 1 }}>
            <Text style={{ fontWeight: '700' }}>{getInitials(user?.fullName)}</Text>
          </View>
          <Text style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 20, fontWeight: '700', color: 'rgba(0, 0, 0, 1)' }}>Профіль</Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(0, 0, 0, 1)', marginBottom: 8, fontWeight: '600', marginLeft: 10 }}>ПІБ</Text>
          <UIInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ваше ім'я"
            style={{ backgroundColor: 'rgba(244, 244, 244, 1)', borderWidth: 0, padding: 14, borderRadius: 12, width: '100%', height: 43 }}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(0, 0, 0, 1)', marginBottom: 8, fontWeight: '600', marginLeft: 10 }}>Номер</Text>
          <UIInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Ваш номер"
            style={{ backgroundColor: 'rgba(244, 244, 244, 1)', borderWidth: 0, padding: 14, borderRadius: 12, width: '100%', height: 43 }}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(0, 0, 0, 1)', marginBottom: 8, fontWeight: '600', marginLeft: 10 }}>Email</Text>
          <UIInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="email@example.com"
            style={{ backgroundColor: 'rgba(244, 244, 244, 1)', borderWidth: 0, padding: 14, borderRadius: 12, width: '100%', height: 43 }}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: 'rgba(0, 0, 0, 1)', marginBottom: 8, fontWeight: '600', marginLeft: 10 }}>Дата народження</Text>
          <UIInput
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="дд.мм.рррр"
            style={{ backgroundColor: 'rgba(244, 244, 244, 1)', borderWidth: 0, padding: 14, borderRadius: 12, width: '100%', height: 43 }}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={{ backgroundColor: 'rgba(254, 245, 216, 1)', borderRadius: 10, padding: 12, marginBottom: 20,  flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ marginRight: 8 }}>
          <Image
        source={require('../../assets/images/ringy.png')}
        style={{ width: 11, height: 13 }}
        resizeMode="cover"
      />
          </Text>
          <Text style={{ color: 'rgba(31, 31, 31, 1)', fontSize: 12, flex: 1 }}>
            Заповнюйте особисті дані та {'\n'}отримуйте персональні пропозиції!
          </Text>
        </View>

        <Text style={{ color: 'rgba(0, 0, 0, 1)', fontWeight: '700', marginBottom: 12 }}>Налаштування</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244, 244, 244, 1)', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginBottom: 24, height: 47 }}>
          <Text style={{ flex: 1, color: 'rgba(0, 0, 0, 1)' }}>Сповіщення</Text>
          <Switch
            value={notifications}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: 'rgba(0, 0, 0, 1)', true: 'rgba(0, 0, 0, 1)' }}
            thumbColor={'rgba(255, 255, 255, 1)'}
            ios_backgroundColor={'rgba(0, 0, 0, 1)'}
          />
        </View>

        <UIButton
          title=" Вихід"
          onPress={() => { /* інтегрувати з auth пізніше */ }}
          leftIcon={require('../../assets/images/door.png')}
          style={{ width: '100%' }}
        />

        <View style={{ marginTop: 24 }}>
          <Text style={{ color: '#6B7280', marginBottom: 4 }}>Про застосунок</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(189, 189, 189, 1)' }}>Версія</Text>
            <Text style={{ color: 'rgba(0, 0, 0, 1)', marginLeft: 8 }}>v1.0</Text>
          </View>
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}