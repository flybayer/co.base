import React from 'react';
import { View } from '@rn';
import TimeEditor from './TimeEditor';
import { useTheme } from './Theme';
import { opacify } from './utils';

export default function TimeInput({ value, onValue, theme: themeProp }) {
  const theme = useTheme(themeProp);
  return (
    <View
      style={{
        borderWidth: 3,
        borderColor: opacify(theme.colorPrimary, 0.6),
        borderRadius: 4,
      }}
    >
      <TimeEditor value={value} onValue={onValue} />
    </View>
  );
}
