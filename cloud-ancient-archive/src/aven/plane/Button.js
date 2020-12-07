import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from '@rn';
import { useTheme } from './Theme';
import { opacify } from './utils';

export default function Button({
  title = null,
  children,
  outline = false,
  onPress,
  onLongPress,
  theme: themeProp,
  disabled = false,
}) {
  const theme = useTheme(themeProp);
  const color = opacify(theme.buttonColor || theme.colorPrimary, 0.8);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      accessible={true}
      disabled={disabled}
      accessibilityRole="button"
    >
      <View
        style={{
          borderRadius: theme.borderRadius,
          borderWidth: theme.borderWidth,
          backgroundColor: outline ? 'transparent' : color,
          borderColor: outline ? color : 'transparent',
          paddingVertical: theme.paddingVertical,
          paddingHorizontal: theme.paddingHorizontal,
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {title && (
          <Text
            style={{
              fontSize: theme.buttonFontSize,
              lineHeight: theme.buttonLineHeight,
              color: outline ? color : 'white',
              fontFamily: theme.fontBold,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
        )}
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            ...StyleSheet.absoluteFill,
          }}
        >
          {children}
        </View>
      </View>
    </TouchableOpacity>
  );
}
