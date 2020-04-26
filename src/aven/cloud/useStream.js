import React from 'react';

export default function useStream(stream) {
  const isStream = !!stream && !!stream.addListener;

  const [value, setValue] = React.useState(
    isStream ? stream.get && stream.get() : stream,
  );

  const [error, setError] = React.useState(null);

  const lastRef = React.useRef(value);

  function applyValue(newValue) {
    // We use this lastRef to ensure that we will only setValue when the value has actually changed.
    // This is a good idea because some observables will re-emit identical values, and we'd rather not waste a render
    if (lastRef.current !== newValue) {
      lastRef.current = newValue;
      setValue(newValue);
    }
  }

  function applyError(error) {
    setError(error);
  }

  React.useEffect(() => {
    if (error) {
      setError(null);
    }
    if (isStream) {
      const listener = {
        next: applyValue,
        error: applyError,
      };
      stream.addListener(listener);
      return () => {
        stream.removeListener(listener);
      };
    }
  }, [error, isStream, stream]);

  if (error) {
    throw error;
    // This component is basically broken at this point, because error will be thrown here until:
    // - A parent is responsible for catching the error and re-mounting us. OR
    // - The observable input changes and the effect clears the error
  }

  return value;
}
