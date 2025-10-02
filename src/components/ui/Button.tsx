import React from 'react';
import { TouchableOpacity, Text, ViewStyle, Image, ImageSourcePropType, View } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  leftIcon?: ImageSourcePropType;
  style?: ViewStyle;
};

export default function UIButton({ title, onPress, leftIcon, style }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={[{ padding: 12, backgroundColor: 'rgba(0, 0, 0, 1)', borderRadius: 16, height: 53, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, style]}>
      {leftIcon && (
        <Image source={leftIcon} style={{ width: 20, height: 20, marginRight: 8 }} />
      )}
      <Text style={{ color: 'rgba(255, 255, 255, 1)', textAlign: 'center', fontSize: 20, fontFamily: 'GothamPro-Bold' }}>{title}</Text>
    </TouchableOpacity>
  );
}


