import React from 'react';
import { Text } from '@rn';
import { useTheme } from './Theme';

export default function Link({ children, to, theme: themeProp = {} }) {
  const theme = useTheme(themeProp);
  const internal = /^\/(?!\/)/.test(to);

  // TODO: hover effect: https://codesandbox.io/s/react-native-hover-hooks-version-4oxpp

  return (
    <Text
      accessibilityRole="link"
      target={internal ? '_self' : '_blank'}
      style={{
        fontFamily: theme.textFont,
        fontWeight: theme.textFontWeight,
        color: theme.colorPrimary,
        fontSize: theme.fontSize,
      }}
    >
      {children}
    </Text>
  );
}
