import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { tabBarStyles } from '../../styles/tabBar';

interface TabItem {
  name: string;
  label: string;
  icon: any;
}

const tabs: TabItem[] = [
  { name: '/(main)/home', label: 'Головна', icon: require('../../../assets/images/icons/Home.png') },
  { name: '/(main)/notifications', label: 'Сповіщення', icon: require('../../../assets/images/icons/not.png') },
  { name: '/(main)/card', label: 'Картка', icon: require('../../../assets/images/icons/card.png') },
  { name: '/(main)/profile', label: 'Профіль', icon: require('../../../assets/images/icons/profile.png') },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = (tabName: string) => {
    router.push(tabName as any);
  };

  return (
    <View style={tabBarStyles.container}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={tabBarStyles.tab}
            onPress={() => handleTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <View style={[
              tabBarStyles.iconContainer,
              isActive && {
                backgroundColor: 'rgba(238, 238, 238, 1)',
                width: 47,
                height: 47,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }
            ]}>
              <Image 
                source={tab.icon} 
                style={tabBarStyles.icon}
                resizeMode="contain"
              />
            </View>
            <Text style={[tabBarStyles.label, isActive && tabBarStyles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
