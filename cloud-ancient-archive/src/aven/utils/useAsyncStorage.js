import { AsyncStorage } from '@rn';
import { useEffect, useState } from 'react';

const UNLOADED_STATE = {};

export function isStateUnloaded(s) {
  return s === UNLOADED_STATE;
}

export default function useAsyncStorage(storageKey, defaultValue) {
  const unloadedValue = UNLOADED_STATE;
  const [storageState, setInternalStorageState] = useState(unloadedValue);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then(stored => {
        if (stored === null) {
          setInternalStorageState(defaultValue);
        } else {
          setInternalStorageState(JSON.parse(stored));
        }
      })
      .catch(console.error);
  }, [defaultValue, storageKey]);

  function setStorageState(newState) {
    if (isStateUnloaded(storageState)) {
      throw new Error(
        'Cannot merge storage state if it has not been loaded yet!',
      );
    }
    setInternalStorageState(newState);
    AsyncStorage.setItem(storageKey, JSON.stringify(newState)).catch(
      console.error,
    );
  }

  return [storageState, setStorageState];
}
