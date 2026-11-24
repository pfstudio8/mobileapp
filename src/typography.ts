import type { TextStyle } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';

/** Fuentes a cargar al iniciar la app. */
export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
};

/** Familias: Inter (UI y números) + Fraunces (títulos grandes). */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  display: 'Fraunces_700Bold',
  displaySoft: 'Fraunces_600SemiBold',
};

/** Tamaño desde el cual un texto pesado se considera título de display (serif). */
export const DISPLAY_MIN_SIZE = 26;

export function fontFamilyFor(weight: TextStyle['fontWeight'], size?: number): string {
  const w = weight === 'bold' ? 700 : weight === 'normal' || weight === undefined ? 400 : Number(weight);
  if (size !== undefined && size >= DISPLAY_MIN_SIZE && w >= 700) return fonts.display;
  if (w >= 800) return fonts.extrabold;
  if (w >= 700) return fonts.bold;
  if (w >= 600) return fonts.semibold;
  if (w >= 500) return fonts.medium;
  return fonts.regular;
}
