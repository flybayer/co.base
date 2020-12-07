import React from 'react';
import { TouchableOpacity, Text, View } from '@rn';
import { useTheme } from './Theme';
import { getStatusColor, opacify } from './utils';

export default function ButtonLink({
  title,
  active = false,
  to,
  theme: themeProp,
  disabled = false,
  status = 'primary',
  onPress,
  onLongPress,
  target,
}) {
  const theme = useTheme(themeProp);
  const color = opacify(getStatusColor(status, theme), 0.8);

  function handlePress() {
    console.log(`Link clicked => go to: ${to}`);
    onPress();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress}
      accessible={true}
    >
      <View
        style={{
          borderWidth: 0,
          borderColor: color,
          backgroundColor: 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
          paddingVertical: theme.paddingVertical,
          borderBottomColor: active ? color : 'transparent',
          borderBottomWidth: 3,
        }}
      >
        <Text
          style={{
            fontSize: theme.fontSize,
            lineHeight: theme.lineHeight,
            color: color,
            fontFamily: theme.fontBold,
            fontWeight: 'bold',
          }}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
