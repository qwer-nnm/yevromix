import { Dimensions } from 'react-native';

const BASE_WIDTH = 360; // базова ширина макета

export function scale(value: number): number {
  const screenWidth = Dimensions.get('window').width || BASE_WIDTH;
  const ratio = screenWidth / BASE_WIDTH;
  return Math.round(value * ratio);
}

export const s = scale;


