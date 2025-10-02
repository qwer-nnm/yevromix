import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { s } from '../../src/utils/scale';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import LoyaltyCard from '../../src/components/ui/LoyaltyCard';
import { selectUser } from '../../src/store/userSlice';

export default function Card() {
  const router = useRouter();
  const user = useSelector(selectUser);
  const sideMargin = 24;
  const cardWidth = Math.max(0, Math.round(Dimensions.get('window').width - sideMargin * 2));
  const innerHorizontalPadding = 20; // padding картки
  const barcodeSidePadding = 20;     // бажані відступи по боках для штрихкоду
  const barcodeWidth = Math.max(0, cardWidth - innerHorizontalPadding * 2 - barcodeSidePadding * 2);
  const headerImageWidth = 162;
  const headerImageHeight = 108;

  const balance = Number((user as any)?.balance ?? 0);
  const discountPercent = Number((user as any)?.discountPercent ?? 0);

  const thresholds = [
    { level: 1, percent: 5,  min: 1500 },
    { level: 2, percent: 8,  min: 40000 },
    { level: 3, percent: 12, min: 150000 },
    { level: 4, percent: 15, min: 300000 },
  ];

  const currentLevel = thresholds.reduce((acc, t) => balance >= t.min ? t.level : acc, 0) || 1;
  const nextThreshold = thresholds.find(t => t.min > balance) || thresholds[thresholds.length - 1];
  const nextLevel = Math.min(currentLevel + 1, 4);
  const remainingToNext = Math.max(0, (nextThreshold?.min ?? balance) - balance);
  const remainingLabel = remainingToNext.toLocaleString('uk-UA');

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <ScrollView style={{ flex: 1, paddingTop: 100, paddingHorizontal: 0 }} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={{ color: 'rgba(255, 255, 255, 1)', fontSize: 24, fontWeight: '700', marginBottom: s(50), textAlign: 'center' }}>
          Картка
        </Text>
        
        {/* Картка лояльності */}
        <View style={{
          width: cardWidth,
          height: 360,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          alignSelf: 'center',
          marginBottom: 22,
          marginTop: 96,
          shadowColor: 'rgba(0,0,0,0.15)',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 24,
          elevation: 10,
          overflow: 'hidden'
        }}>
          <View style={{ flex: 1 }}>
            {/* Верхній контент з картинкою справа */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>ЄВРОМІКС</Text>
              <Text style={{ color: 'rgba(0, 0, 0, 1)', fontSize: 16, marginBottom: 12 }}>Бонусна картка</Text>
              <Text style={{ color: 'rgba(166, 166, 166, 1)', fontSize: 12, marginBottom: 12 }}>Номер картки: {'\n'}{user?.cardNumber || 'Завантаження...'}</Text>
                <View style={{ backgroundColor: 'rgba(254, 245, 216, 1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                <Text style={{ fontSize: 12, marginRight: 4 }}>🔥</Text>
                <Text style={{ color: 'rgba(31, 31, 31, 1)', fontSize: 12,fontWeight: '500' }}>Ще {remainingLabel} грн до {nextLevel} рівня знижки</Text>
              </View>
              <View style={{ alignItems: 'center', marginBottom: 30 }}>
                <LoyaltyCard width={barcodeWidth} />
                {(() => {
                  const cardNumberStr = String(user?.cardNumber || '');
                  const digits = cardNumberStr.replace(/\D/g, '').slice(0, 8).padEnd(8, '0');
                  const groups = digits.match(/.{1,2}/g) || [];
                  return (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 0, width: barcodeWidth }}>
                      {groups.slice(0, 4).map((g, idx) => (
                        <Text key={idx} style={{ color: '#000000', fontSize: 12 }}>{g}</Text>
                      ))}
                    </View>
                  );
                })()}
              </View>
              <View style={{ height: 1, backgroundColor: '#E5E7EB', width: barcodeWidth, alignSelf: 'center' }} />
              </View>
              <Image
                source={require('../../assets/images/cardscrren.png')}
                style={{ width: headerImageWidth, height: headerImageHeight, position: 'absolute', top: -20, right: -20, borderTopRightRadius: 16 }}
                resizeMode="cover"
              />
            </View>

            {/* Нижній контент, пришитий до низу картки */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <View>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Постійна знижка</Text>
                <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700' }}>{discountPercent || thresholds.find(t=>t.level===currentLevel)?.percent}%</Text>
              </View>
              <View>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>Рівень</Text>
                <Text style={{ color: '#000000', fontSize: 16, fontWeight: '700' }}>{currentLevel}/4</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Кнопка закриття */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 66,
            height: 66,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: 33,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginTop: 32
          }}
        >
          <Image
            source={require('../../assets/images/chrest.png')}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </ScrollView>
      {/* TabBar прибрано для цього екрану */}
    </View>
  );
}