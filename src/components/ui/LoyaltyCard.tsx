import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Svg, Rect, G } from "react-native-svg";
import { useSelector, useDispatch } from 'react-redux';
import { logger } from '../../utils/logger';
import { selectUser, selectCardNumber, selectIsLoading, selectError, fetchUserProfile } from '../../store/userSlice';
import type { AppDispatch } from '../../store';

// Спрощена реалізація CODE128 (тільки цифри)
function encode(data: string): boolean[] {
  // Start Code B
  const startCode: boolean[] = [true,true,false,true,true,false,false,true,true,false,false];
  
  // Кодуємо кожну цифру
  const encodedData = data.split('').flatMap(char => {
    const code = char.charCodeAt(0) - 32;
    return code.toString(2)
      .padStart(8, '0')
      .split('')
      .map(bit => bit === '1');
  });

  // Stop Code
  const stopCode: boolean[] = [true,true,false,false,true,true,false,false,true,true];

  return [...startCode, ...encodedData, ...stopCode];
}

type Props = { width?: number; height?: number };

export default function LoyaltyCard({ width, height }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const cardNumber = useSelector(selectCardNumber) || user?.cardNumber;
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const requestedRef = useRef(false);

  useEffect(() => {
    logger.info('LoyaltyCard state:', { user: Boolean(user), cardNumber, isLoading, error });

    // Один запит на монтування або якщо немає cardNumber
    if (!requestedRef.current && !cardNumber && !isLoading) {
      requestedRef.current = true;
      logger.info('Fetching user profile for card number');
      dispatch(fetchUserProfile());
    }
  }, [dispatch, cardNumber, isLoading]);

  if (isLoading && !cardNumber) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 70 }}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 70 }}>
        <Text style={{ color: '#EF4444', fontSize: 12 }}>Помилка завантаження картки</Text>
      </View>
    );
  }

  if (!cardNumber) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 70 }}>
        <Text style={{ color: '#6B7280', fontSize: 12 }}>Картка не знайдена</Text>
      </View>
    );
  }

  // Розраховуємо параметри штрих-коду
  const barcodeWidth = width ?? 272; // Ширина за потреби від батьківського контейнера
  const barcodeHeight = height ?? 45; // Фіксована висота
  // Масштабуємо ширину смуги так, щоб увесь штрихкод рівно вписався у задану ширину
  const barWidth = barcodeWidth / (encode(cardNumber).length || 1);

  // Отримуємо масив бінарних значень
  const barcodeData = encode(cardNumber);
  
  return (
    <View style={{ alignItems: 'center', width: barcodeWidth }}>
      <Svg width={barcodeWidth} height={barcodeHeight} viewBox={`0 0 ${barcodeWidth} ${barcodeHeight}`}>
        <G>
          {barcodeData.map((bar: boolean, i: number) => (
            bar ? (
              <Rect
                key={i}
                x={i * barWidth}
                y={0}
                width={barWidth}
                height={barcodeHeight}
                fill="#000000"
              />
            ) : null
          ))}
        </G>
      </Svg>
    </View>
  );
}