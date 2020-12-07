import React from 'react';
import { Text, View } from '@rn';
import { useTheme } from './Theme';
import { opacify, getStatusColor } from './utils';

export default function Tag({
  title,
  status = 'neutral', // positive | negative | warning
  theme: themeProp,
}) {
  const theme = useTheme(themeProp);
  const color = getStatusColor(status, theme);
  return (
    <View
      style={{
        borderRadius: theme.borderRadius,
        backgroundColor: theme.tagColor || opacify(color, 0.8),
        paddingVertical: theme.paddingVertical,
        paddingHorizontal: theme.paddingHorizontal,
        minWidth: theme.tagMinWidth || 150,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: theme.fontBold,
          letterSpacing: theme.fontLetterSpacing,
          color: 'white',
          fontSize: theme.fontSize,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </View>
  );
}
