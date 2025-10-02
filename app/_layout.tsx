import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '../src/store';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { notificationsService } from '../src/services/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'GothamPro-Regular': require('../assets/fonts/GothamProRegular.ttf'),
    'GothamPro-Medium': require('../assets/fonts/GothamProMedium.ttf'),
    'GothamPro-Bold': require('../assets/fonts/GothamProBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Встановлюємо шрифт за замовчуванням для Text та TextInput
      (RNText as any).defaultProps = (RNText as any).defaultProps || {};
      (RNText as any).defaultProps.style = [
        (RNText as any).defaultProps.style || {},
        { fontFamily: 'GothamPro-Regular' },
      ];

      (RNTextInput as any).defaultProps = (RNTextInput as any).defaultProps || {};
      (RNTextInput as any).defaultProps.style = [
        (RNTextInput as any).defaultProps.style || {},
        { fontFamily: 'GothamPro-Regular' },
      ];

      // Ініціалізуємо сервіс нотифікацій
      notificationsService.init().catch(console.error);

      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Provider store={store}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 200,
          animationTypeForReplace: 'push',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          presentation: 'card',
          // Фон контенту стеку
          contentStyle: { backgroundColor: '#F5F5F5' },
        }}
      />
    </Provider>
  );
}