import React from 'react';
import useKeyboardPopover from './useKeyboardPopover';
import Button from './Button';
import Text from './Text';
import { useTheme } from './Theme';
import { View } from '@rn';
import { opacify } from './utils';

export default function useAsyncErrorPopover(onError) {
  const theme = useTheme();
  const { onPopover } = useKeyboardPopover(({ onClose, openArguments }) => {
    return (
      <View
        style={{
          minHeight: 100,
          width: 320,
          padding: 30,
        }}
      >
        <Text
          bold
          theme={{
            fontSize: 20,
          }}
        >
          {openArguments[0].name}
        </Text>
        <Text
          theme={{
            fontColor: opacify(theme.colorForeground, 0.6),
            fontSize: 18,
          }}
        >
          {openArguments[0].message}
        </Text>
        <Button onPress={onClose} title="ok" />
      </View>
    );
  });
  function handler(promise) {
    return promise.catch(error => {
      const handled = onError && onError(error);
      if (!handled) {
        onPopover(error);
      }
    });
  }
  return handler;
}
