import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Platform, StatusBar, Dimensions } from 'react-native';
import { s } from '../../src/utils/scale';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import TabBar from '../../src/components/ui/TabBar';
import type { AppDispatch } from '../../src/store';
import { fetchNotifications, selectNotifications, selectNotificationsLoading, selectNotificationsError, readAllNotifications } from '../../src/store/notificationsSlice';
import { selectUser } from '../../src/store/userSlice';
import type { NotificationItem } from '../../src/api/notifications';

export default function NotificationsScreen() {
  const sidePadding = s(24);
  const cardWidth = Math.max(0, Math.round(Dimensions.get('window').width - sidePadding * 2));
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const items = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);
  const user = useSelector(selectUser);

  const getInitials = (fullName: string | null | undefined): string => {
    if (!fullName) return 'ГГ';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    } else if (names.length === 1) {
      return ((names[0][0] + (names[0][1] || '')).toUpperCase());
    }
    return 'ГГ';
  };

  const requestedRef = useRef(false);
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    dispatch(fetchNotifications({}));
  }, [dispatch]);

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5', paddingTop: topInset }}>
      {/* Кнопка ініціалів як на головній (позиціюємо від верху на 28px) */}
      <View style={{ position: 'absolute', top: topInset + s(36), right: 16, zIndex: 10 }}>
        <TouchableOpacity activeOpacity={0.8} style={{ width: 39, height: 39, backgroundColor: 'rgba(255, 255, 255, 1)', borderRadius: 10, alignItems: 'center', justifyContent: 'center',borderColor: 'rgba(210, 210, 210, 1)',borderWidth: 1 }}>
          <Text style={{ color: 'rgba(70, 56, 43, 1)', fontSize: 16, fontWeight: '700' }}>{getInitials(user?.fullName)}</Text>
        </TouchableOpacity>
      </View>

      {/* Back + centered title */}
      <View style={{ paddingHorizontal: s(16), marginTop: s(8), marginBottom: s(23) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 100, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Image
        source={require('../../assets/images/arrow.png')}
        style={{ width: 11, height: 10 }}
        resizeMode="cover"
      />
              </View>
              <Text style={{ color: 'rgba(132,132,127,1)', fontSize: 18, fontWeight: '400' }}>Назад</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: 'rgba(0,0,0,1)', fontSize: 20, fontWeight: '600' }}>Сповіщення</Text>
          </View>
          <View style={{ width: 100, alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={() => dispatch(readAllNotifications())} style={{ marginTop: s(80) }}>
              <Text style={{ color: '#111', fontSize: 14, textDecorationLine: 'underline' }}>Прочитано все</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: s(120) }}>

        {loading && (
          <ActivityIndicator style={{ marginTop: 20 }} />
        )}

        {!loading && error && (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 }}>Сповіщення скоро будуть</Text>
          </View>
        )}

        {!loading && !error && items.length === 0 && (
          <Text style={{ color: '#4B5563', fontSize: 16, marginTop: 12 }}>Сповіщення скоро будуть</Text>
        )}

        {!loading && !error && items.length > 0 && (() => {
          // Групування за місяць/рік
          const groups = items.reduce((acc: Record<string, NotificationItem[]>, n) => {
            const d = new Date(n.createdAt);
            const key = d.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
            (acc[key] = acc[key] || []).push(n);
            return acc;
          }, {} as Record<string, NotificationItem[]>);

          return Object.entries(groups).map(([title, list]) => (
            <View key={title} style={{ alignSelf: 'center', width: cardWidth }}>
              <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 18, fontWeight: '700', marginBottom: s(12) }}>{title.charAt(0).toUpperCase() + title.slice(1)}</Text>
              {list.map((n) => {
                const wasRead = readIds.has(n.id) || n.status === 'read';
                const isUnread = !wasRead;
                return (
                  <TouchableOpacity
                    key={n.id}
                    activeOpacity={0.8}
                    onPress={() => setReadIds(new Set([...readIds, n.id]))}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                      borderRadius: 8,
                      padding: s(16),
                      marginBottom: s(16),
                      shadowColor: 'rgba(0,0,0,0.15)',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 1,
                      shadowRadius: 20,
                      elevation: 6,
                      width: cardWidth,
                      height: s(73),
                      alignSelf: 'center',
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <View style={{ width: s(44), height: s(44), borderRadius: 12, backgroundColor: isUnread ? '#111' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: s(12) }}>
                      <Image source={require('../../assets/images/icons/not.png')} style={{ width: s(20), height: s(20), tintColor: isUnread ? '#fff' : '#9CA3AF' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#111', fontSize: 14, fontWeight: '700', marginBottom: s(4) }}>{n.title}</Text>
                      <Text style={{ color: '#4B5563', fontSize: 14 }}>{n.message}</Text>
                    </View>
                    <View style={{ marginLeft: s(12), alignItems: 'flex-end' }}>
                      <Text style={{ color: '#111', fontSize: 12, fontWeight: '700' }}>{new Date(n.createdAt).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
                      <Text style={{ color: '#111', fontSize: 24, fontWeight: '700' }}>{new Date(n.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ));
        })()}

        
      </ScrollView>
      <TabBar />
    </View>
  );
}
