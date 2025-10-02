import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import TabBar from '../../src/components/ui/TabBar';

export default function Orders() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <ScrollView style={{ flex: 1, paddingTop: 50, paddingHorizontal: 20 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700', marginBottom: 20 }}>
          Історія замовлень
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 16 }}>
          Тут буде історія ваших покупок
        </Text>
      </ScrollView>
      <TabBar />
    </View>
  );
}