import React, { useContext, useState } from 'react';
import { View, TouchableWithoutFeedback, StyleSheet } from '@rn';
import { useNavigation } from '@aven/navigation-hooks';
import { NavigationContext } from '@aven/navigation-core';

export const PopoverContext = React.createContext(null);

export function PopoverTarget({ renderContent, renderPopover, timing }) {
  const ctx = useContext(PopoverContext);
  const navigation = useNavigation();
  async function onPopover(...openArguments) {
    const location = await new Promise(resolve =>
      viewRef.current.measure((x, y, width, height, pageX, pageY) => {
        resolve({ x, y, width, height, pageX, pageY });
      }),
    );
    ctx.openPopover(
      renderPopover(),
      location,
      timing,
      navigation,
      openArguments,
    );
  }
  const viewRef = React.createRef();
  return <View ref={viewRef}>{renderContent(onPopover)}</View>;
}

export function useTargetPopover(renderPopover, timing) {
  const ctx = useContext(PopoverContext);
  const navigation = useNavigation();
  const targetRef = React.createRef();
  async function onPopover(...openArguments) {
    const location = await new Promise(resolve =>
      targetRef.current.measure((x, y, width, height, pageX, pageY) => {
        resolve({ x, y, width, height, pageX, pageY });
      }),
    );
    ctx.openPopover(renderPopover, location, timing, navigation, openArguments);
  }
  return { targetRef, onPopover };
}

export function usePopover(renderPopover, timing) {
  const ctx = useContext(PopoverContext);
  const navigation = useNavigation();
  async function onPopover(...args) {
    ctx.openPopover(renderPopover, null, timing, navigation, args);
  }
  return { onPopover };
}
