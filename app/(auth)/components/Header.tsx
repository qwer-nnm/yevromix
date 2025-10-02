import React from 'react';
import { View, Text, Image } from 'react-native';

export default function Header() {
  return (
    <View style={{ width: '100%', height: 393, position: 'relative' }}>
      <Image
        source={require('../../../assets/images/rega.png')}
        style={{ 
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        resizeMode="cover"
      />
      <View style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center', 
        alignItems: 'center'
      }}>
        <Image 
          source={require('../../../assets/images/ЄВРОМІКС.png')} 
          style={{ width: 200, height: 60, marginBottom: 10 }}
          resizeMode="contain"
        />
        <Text style={{ color: '#FFFFFF', opacity: 0.95, fontSize: 12, marginTop: 6 }}>
          Магазин одягу, взуття та аксесуарів
        </Text>
      </View>
    </View>
  );
}
