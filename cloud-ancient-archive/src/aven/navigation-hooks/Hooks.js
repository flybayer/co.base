import { useState, useContext, useEffect } from 'react';
import { NavigationContext } from '@aven/navigation-core';

export function useNavigation() {
  return useContext(NavigationContext);
}

export function useNavigationParam(paramName) {
  return useNavigation().getParam(paramName);
}

export function useNavigationState() {
  return useNavigation().state;
}

export function useNavigationKey() {
  return useNavigation().state.key;
}

export function useNavigationDidFocusEffect(handleDidFocus) {
  const navigation = useNavigation();
  useEffect(() => {
    const { key } = navigation.state;
    const parentNav = navigation.dangerouslyGetParent();
    if (!parentNav) {
      return () => {};
    }
    const parentState = parentNav.state;
    const isFocused = parentState.routes[parentState.index].key === key;
    const { isTransitioning } = parentState;
    if (isFocused && !isTransitioning) {
      handleDidFocus();
    }
    const subsDF = navigation.addListener('didFocus', handleDidFocus);
    return () => {
      subsDF.remove();
    };
  }, [handleDidFocus, navigation, navigation.addListener]);
}

export function useNavigationWillFocusEffect(handleWillFocus) {
  const navigation = useNavigation();
  useEffect(() => {
    if (navigation.isFocused()) {
      handleWillFocus();
    }
    const subsWF = navigation.addListener('willFocus', handleWillFocus);
    return () => {
      subsWF.remove();
    };
  }, [handleWillFocus, navigation, navigation.addListener]);
}

export function useNavigationWillBlurEffect(handleWillBlur) {
  const navigation = useNavigation();
  useEffect(() => {
    const subsWB = navigation.addListener('willBlur', handleWillBlur);
    return () => {
      subsWB.remove();
    };
  }, [handleWillBlur, navigation, navigation.addListener]);
}

export function useNavigationDidBlurEffect(handleDidBlur) {
  const navigation = useNavigation();
  useEffect(() => {
    const subsDB = navigation.addListener('didBlur', handleDidBlur);
    return () => {
      subsDB.remove();
    };
  }, [handleDidBlur, navigation, navigation.addListener]);
}

export function useNavigationEvents(handleEvt) {
  const navigation = useNavigation();
  useEffect(
    () => {
      const subsA = navigation.addListener('action', handleEvt);
      const subsWF = navigation.addListener('willFocus', handleEvt);
      const subsDF = navigation.addListener('didFocus', handleEvt);
      const subsWB = navigation.addListener('willBlur', handleEvt);
      const subsDB = navigation.addListener('didBlur', handleEvt);
      return () => {
        subsA.remove();
        subsWF.remove();
        subsDF.remove();
        subsWB.remove();
        subsDB.remove();
      };
    },
    // For TODO consideration: If the events are tied to the navigation object and the key
    // identifies the nav object, then we should probably pass [navigation.state.key] here, to
    // make sure react doesn't needlessly detach and re-attach this effect. In practice this
    // seems to cause troubles
    // undefined,
    // [navigation.state.key]
    [handleEvt, navigation, navigation.addListener],
  );
}

const emptyFocusState = {
  isFocused: false,
  isBlurring: false,
  isBlurred: false,
  isFocusing: false,
};
const didFocusState = { ...emptyFocusState, isFocused: true };
const willBlurState = { ...emptyFocusState, isBlurring: true };
const didBlurState = { ...emptyFocusState, isBlurred: true };
const willFocusState = { ...emptyFocusState, isFocusing: true };
const getInitialFocusState = isFocused =>
  isFocused ? didFocusState : didBlurState;
function focusStateOfEvent(eventName) {
  switch (eventName) {
    case 'didFocus':
      return didFocusState;
    case 'willFocus':
      return willFocusState;
    case 'willBlur':
      return willBlurState;
    case 'didBlur':
      return didBlurState;
    default:
      return null;
  }
}

export function useFocusState() {
  const navigation = useNavigation();
  const isFocused = navigation.isFocused();
  const [focusState, setFocusState] = useState(getInitialFocusState(isFocused));
  function handleEvt(e) {
    const newState = focusStateOfEvent(e.type);
    newState && setFocusState(newState);
  }
  useNavigationEvents(handleEvt);
  return focusState;
}
