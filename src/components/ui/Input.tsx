import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

export default function UIInput(props: TextInputProps) {
  return <TextInput {...props} style={[{ borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontFamily: 'GothamPro-Regular' }, props.style]} />;
}


