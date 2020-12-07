import React, { useContext, useState } from 'react';
import { View, TouchableWithoutFeedback, StyleSheet } from '@rn';
import { useNavigation } from '@aven/navigation-hooks';
import { NavigationContext } from '@aven/navigation-core';
import Animated, { Easing } from 'react-native-reanimated';

import {
  PopoverTarget as Target,
  usePopover as use,
  useTargetPopover as useTarget,
  PopoverContext as Context,
} from './PopoverCommon';

export const PopoverTarget = Target;
export const usePopover = use;
export const useTargetPopover = useTarget;
export const PopoverContext = Context;

const defaultTiming = {
  duration: 500,
  easing: Easing.out(Easing.poly(5)),
};

export function PopoverContainer({ children }) {
  let [configuredTiming, setConfiguredTiming] = useState(null);
  let [openValue] = useState(new Animated.Value(0));
  let [popover, setPopover] = useState(null);
  let [containerLayout, setContainerLayout] = useState(null);
  function closePopover() {
    Animated.timing(openValue, {
      toValue: new Animated.Value(0),
      ...(configuredTiming || defaultTiming),
    }).start(() => {
      setPopover(null);
    });
  }
  function openPopover(
    renderPopover,
    location,
    timing,
    navigation,
    openArguments,
  ) {
    setConfiguredTiming(timing);
    setPopover(
      <NavigationContext.Provider value={navigation}>
        {renderPopover({
          onClose: closePopover,
          location,
          containerLayout,
          openValue,
          openArguments,
        })}
      </NavigationContext.Provider>,
    );
  }

  React.useEffect(() => {
    if (popover) {
      Animated.timing(openValue, {
        toValue: new Animated.Value(1),
        ...(configuredTiming || defaultTiming),
      }).start(() => {});
    }
  }, [popover, configuredTiming, openValue]);

  return (
    <View
      style={{ flex: 1 }}
      onLayout={e => {
        setContainerLayout(e.nativeEvent.layout);
      }}
    >
      <PopoverContext.Provider value={{ openPopover }}>
        {children}
      </PopoverContext.Provider>
      {popover && (
        <React.Fragment>
          <TouchableWithoutFeedback onPress={closePopover}>
            <Animated.View
              style={{
                backgroundColor: '#fff4',
                opacity: openValue,
                ...StyleSheet.absoluteFillObject,
              }}
            />
          </TouchableWithoutFeedback>
          {popover}
        </React.Fragment>
      )}
    </View>
  );
}
