import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Loader() {
  return (
    <View style={{ padding: 16 }}>
      <ActivityIndicator />
    </View>
  );
}


