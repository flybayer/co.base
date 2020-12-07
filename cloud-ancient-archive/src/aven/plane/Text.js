import React from 'react';
import { Text } from '@rn';
import { useTheme } from './Theme';

export default function LiteralText({
  children,
  theme: themeProp,
  bold = false,
  style,
  center = false,
  debug = false,
  ...rest
}) {
  const theme = useTheme(themeProp);
  return (
    <Text
      style={[
        {
          fontSize: theme.fontSize,
          lineHeight: theme.lineHeight || Math.floor((theme.fontSize / 2) * 3),
          color: theme.colorForeground,
          fontFamily: theme.textFont,
          fontWeight: theme.fontWeight,
        },
        bold && { fontWeight: 'bold', fontFamily: theme.fontBold },
        center && { textAlign: 'center' },
        debug && { backgroundColor: 'pink' },
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
