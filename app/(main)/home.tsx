import React from 'react';
import { View, Image, Text, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { s } from '../../src/utils/scale';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import TabBar from '../../src/components/ui/TabBar';
import BannerSlider from '../../src/components/ui/BannerSlider';
import { selectUser } from '../../src/store/userSlice';
import { fetchNotifications, selectNotifications } from '../../src/store/notificationsSlice';
import type { AppDispatch } from '../../src/store';
import type { NotificationItem } from '../../src/api/notifications';
import { mockNotifications } from '../../src/mocks/notifications';

export default function Home() {
  const sidePadding = s(24);
  const cardWidth = Math.max(0, Math.round(Dimensions.get('window').width - sidePadding * 2));
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const notifications = useSelector(selectNotifications);
  
  // Дані для рівня знижки та прогресу
  const balance = Number((user as any)?.balance ?? 0);
  const discountPercent = Number((user as any)?.discountPercent ?? 0);
  const thresholds = [
    { level: 1, percent: 5,  min: 1500 },
    { level: 2, percent: 8,  min: 40000 },
    { level: 3, percent: 12, min: 150000 },
    { level: 4, percent: 15, min: 300000 },
  ];
  const currentLevel = thresholds.reduce((acc, t) => balance >= t.min ? t.level : acc, 0);
  const nextIndex = thresholds.findIndex(t => t.min > balance);
  const isMaxLevel = nextIndex === -1; // баланс >= останнього порога
  const nextThreshold = isMaxLevel ? thresholds[thresholds.length - 1] : thresholds[nextIndex];
  const nextLevel = isMaxLevel ? 4 : Math.min((currentLevel || 0) + 1, 4);
  const levelNames = ['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const levelLabel = levelNames[(currentLevel ? currentLevel - 1 : 0)] || 'SILVER';
  
  // Прогрес між попереднім та наступним порогом
  const nextMin = nextThreshold.min;
  const prevMin = isMaxLevel ? nextMin : (nextIndex === 0 ? 0 : thresholds[nextIndex - 1].min);
  const progress = isMaxLevel
    ? 1
    : Math.max(0, Math.min(1, (balance - prevMin) / (nextMin - prevMin)));
  const progressPercent = Math.round(progress * 100);
  
  const remainingToNext = isMaxLevel ? 0 : Math.max(0, nextMin - balance);
  const remainingLabel = remainingToNext.toLocaleString('uk-UA');
  
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

  // Завантажуємо останні сповіщення для прев'ю
  React.useEffect(() => {
    // Уникаємо дублюючих запитів
    // Нехай завантаження відбувається один раз при монтуванні, якщо ще не було даних
    if (notifications.length === 0) {
      dispatch(fetchNotifications({}));
    }
  }, [dispatch]);

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={require('../../assets/images/fon.png')}
        style={{ width: '100%', height: 500 }}
        resizeMode="cover"
      />
      <View style={{ position: 'absolute', top: 50, left: 20, right: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'rgba(255, 255, 255, 1)', fontSize: 16, fontWeight: '400' }}>Євромікс</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Linking.openURL('https://www.google.com/maps/search/%D1%94%D0%B2%D1%80%D0%BE%D0%BC%D1%96%D0%BA%D1%81/@49.1601547,24.9719238,7z?entry=s&sa=X&ved=1t%3A199789')}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}
            >
              <Image
                source={require('../../assets/images/map.png')}
                style={{ width: 14, height: 14, marginRight: 6 }}
                resizeMode="contain"
              />
              <Text style={{ color: 'rgba(178, 178, 178, 1)', fontSize: 11 }}>Магазини на мапі</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(main)/profile')}
            style={{ width: 39, height: 39, backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: 'rgba(70, 56, 43, 1)', fontSize: 16, fontWeight: '700' }}>
              {getInitials(user?.fullName)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Слайдер банерів */}
        <BannerSlider />

        {/* Заголовок під слайдером */}
        <Text style={{
          marginTop: s(39),
          marginLeft: s(10),
          color: 'rgba(255, 255, 255, 1)',
          fontSize: 20,
          fontWeight: '400'
        }}>
          {`Вітаю, ${user?.fullName ? user.fullName.trim().split(' ')[0] : 'Гість'}!`}
        </Text>

        {/* Карточка рівня знижки */}
        <View
          style={{
            marginTop: s(19),
            alignSelf: 'center',
            width: cardWidth,
            height: s(128),
            backgroundColor: 'rgba(255, 255, 255, 1)',
            borderRadius: 16,
            padding: s(16),
            shadowColor: 'rgba(0,0,0,0.15)',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 6
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#111', fontSize: 18, fontWeight: '700' }}>Рівень знижки</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 16, fontWeight: '700', marginRight: 6 }}>{levelLabel}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 14 }}>ⓘ</Text>
            </View>
          </View>

          {/* Прогрес-бар */}
          <View style={{ marginTop: s(14) }}>
            <View style={{ height: s(6), backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'rgba(255, 184, 5, 1)' }} />
            </View>
          </View>

          {/* Інфо-плашка */}
          <View style={{
            marginTop: s(12),
            backgroundColor: 'rgba(254, 245, 216, 1)',
            borderRadius: 10,
            paddingVertical: s(10),
            paddingHorizontal: s(12),
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ marginRight: s(8) }}>
            <Image
                source={require('../../assets/images/fire.png')}
                style={{ width: 14, height: 14, marginRight: 6 }}
                resizeMode="contain"
              />
            </Text>
            <Text style={{ color: 'rgba(31, 31, 31, 1)', fontSize: 14, fontWeight: '600' }}>Ще {remainingLabel} грн до {nextLevel} рівня знижки</Text>
          </View>
        </View>

        {/* Останні сповіщення прев'ю */}
        <View style={{ marginTop: s(18), alignSelf: 'center', width: cardWidth }}>
          <Text style={{ color: '#111', fontSize: 18, fontWeight: '700', marginBottom: s(10) }}>Останні сповіщення</Text>
          {/* Використовуємо реальні дані або моки */}
          {(notifications.length > 0 ? notifications : mockNotifications).slice(0, 2).map((n: NotificationItem) => {
            const isUnread = n.status !== 'read';
            return (
              <View
                key={n.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: s(12),
                  marginBottom: s(10),
                  shadowColor: 'rgba(0,0,0,0.15)',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 20,
                  elevation: 6,
                  width: '100%',
                  height: s(73),
                  alignSelf: 'center',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <View style={{ width: s(40), height: s(40), borderRadius: 12, backgroundColor: isUnread ? '#111' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: s(12) }}>
                  <Image source={require('../../assets/images/icons/not.png')} style={{ width: s(18), height: s(18), tintColor: isUnread ? '#fff' : '#9CA3AF' }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#111', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{n.title}</Text>
                  <Text style={{ color: '#4B5563', fontSize: 14 }} numberOfLines={2}>{n.message}</Text>
                </View>
                <View style={{ marginLeft: s(12), alignItems: 'flex-end' }}>
                  <Text style={{ color: '#111', fontSize: 12, fontWeight: '700' }}>{new Date(n.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                  <Text style={{ color: '#111', fontSize: 24, fontWeight: '700' }}>{new Date(n.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <TabBar />
    </View>
  );
}