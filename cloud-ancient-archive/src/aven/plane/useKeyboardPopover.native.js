import React from 'react';
import { usePopover } from '@aven/views';
import { Easing } from 'react-native-reanimated';
import KeyboardPopover from './KeyboardPopover';

export default function useKeyboardPopover(onRenderContent) {
  return usePopover(
    props => {
      return (
        <KeyboardPopover {...props}>{onRenderContent(props)}</KeyboardPopover>
      );
    },
    { easing: Easing.inOut(Easing.poly(5)), duration: 500 },
  );
}
