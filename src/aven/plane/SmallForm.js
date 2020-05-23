import React from 'react';
import { View, Text } from '@rn';
import { useTheme } from './Theme';

export default function SmallForm({ children, title }) {
  const { borderRadius, paddingVertical, paddingHorizontal } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignSelf: 'stretch',
      }}
    >
      <View
        style={{
          flex: 1,
          maxWidth: 320,
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius,
          paddingHorizontal,
          paddingVertical,
          paddingTop: 42,
        }}
      >
        <Text
          style={{
            position: 'absolute',
            top: -6,
            left: paddingHorizontal + 8,
            fontSize: 28,
            fontFamily: 'Helvetica',
            fontWeight: 'bold',
            color: '#bbb',
          }}
        >
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}
