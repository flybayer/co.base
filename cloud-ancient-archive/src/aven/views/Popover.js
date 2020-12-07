import React, { useContext, useState, useRef } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Easing,
} from '@rn';
import { useNavigation } from '@aven/navigation-hooks';
import { NavigationContext } from '@aven/navigation-core';
import cuid from 'cuid';

const PopoverContext = React.createContext(null);

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

const defaultTiming = {
  duration: 3000,
  easing: Easing.linear,
};

export function PopoverContainer({ children }) {
  let timingConfig = useRef(defaultTiming);
  let [popovers, dispatch] = React.useReducer((prevState = [], action) => {
    if (action.type === 'open') {
      const { content, id, openValue } = action;
      return [...prevState, { content, id, openValue }];
    }
    if (action.type === 'close') {
      return prevState.filter(s => s.id !== action.id);
    }
    return prevState;
  });
  function handleClose(id, openValue) {
    Animated.timing(openValue, {
      toValue: 0,
      ...(timingConfig.current || defaultTiming),
    }).start(() => {
      dispatch({ type: 'close', id });
    });
  }
  let [containerLayout, setContainerLayout] = useState(null);
  function openPopover(renderPopover, location, timing, navigation, args) {
    timingConfig.current = timing;
    const id = cuid();
    const openValue = new Animated.Value(0);
    dispatch({
      type: 'open',
      id,
      openValue,
      content: (
        <NavigationContext.Provider value={navigation}>
          {renderPopover({
            onClose: () => handleClose(id, openValue),
            location,
            containerLayout,
            openValue,
            openArguments: args,
          })}
        </NavigationContext.Provider>
      ),
    });
    Animated.timing(openValue, {
      toValue: 1,
      ...(timingConfig.current || defaultTiming),
    }).start(() => {});
  }

  return (
    <View
      style={{ flex: 1 }}
      onLayout={e => {
        setContainerLayout(e.nativeEvent.layout);
      }}
    >
      <PopoverContext.Provider value={{ openPopover }}>
        {children}
        {popovers &&
          popovers.map(popover => (
            <React.Fragment>
              <TouchableWithoutFeedback
                onPress={() => {
                  handleClose(popover.id, popover.openValue);
                }}
              >
                <Animated.View
                  style={{
                    backgroundColor: '#fff4',
                    opacity: popover.openValue,
                    ...StyleSheet.absoluteFillObject,
                  }}
                />
              </TouchableWithoutFeedback>
              {popover.content}
            </React.Fragment>
          ))}
      </PopoverContext.Provider>
    </View>
  );
}
