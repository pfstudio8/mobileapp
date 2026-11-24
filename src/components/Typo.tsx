import { forwardRef } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { fontFamilyFor } from '../typography';

/** Resuelve fontFamily real según weight/tamaño (RN no sintetiza pesos con fuentes custom). */
function resolve(style: TextProps['style']): TextStyle {
  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const { fontWeight, fontFamily, fontVariant, ...rest } = flat;
  return {
    ...rest,
    fontFamily: fontFamily ?? fontFamilyFor(fontWeight, flat.fontSize),
    // Números tabulares y alineados (sin saltos al cambiar de valor)
    fontVariant: fontVariant ?? ['tabular-nums', 'lining-nums'],
  };
}

export const Text = forwardRef<RNText, TextProps>(function Text({ style, ...props }, ref) {
  return <RNText ref={ref} {...props} style={resolve(style)} />;
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  { style, ...props },
  ref,
) {
  return <RNTextInput ref={ref} {...props} style={resolve(style as TextProps['style'])} />;
});
