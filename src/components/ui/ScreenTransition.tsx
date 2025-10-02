import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { usePathname } from 'expo-router';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenTransition({ children, style }: Props) {
  const pathname = usePathname();
  // Зберігаємо анімаційні значення між рендерами, щоб не миготіло при вводі в TextInput
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Запускаємо анімацію при кожній зміні шляху
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    };
  }, [pathname]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
