import React from 'react';
import { useTheme } from './Theme';
import Text from './Text';

export default function Heading({
  title,
  center = false,
  theme: themeProp = {},
}) {
  const theme = useTheme(themeProp);
  return (
    <Text
      theme={{
        colorForeground: theme.colorPrimary,
        fontSize: theme.headingFontSize,
        lineHeight: theme.headingLineHeight,
        fontWeight: theme.headingFontWeight,
        textFont: theme.headingFont,
      }}
      center={center}
    >
      {title}
    </Text>
  );
}
