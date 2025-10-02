import React from 'react';
import { View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import TabBar from '../components/ui/TabBar';

interface TabNavigatorProps {
  children: React.ReactNode;
}

export default function TabNavigator({ children }: TabNavigatorProps) {
  return (
    <View style={{ flex: 1 }}>
      {children}
      <TabBar />
    </View>
  );
}
