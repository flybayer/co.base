import { useState } from 'react';

export default function useAsyncError(onError) {
  const [error, setError] = useState(null);
  if (error) {
    throw error;
  }
  function handler(promise) {
    return promise.catch(error => {
      const handled = onError && onError(error);
      if (!handled) {
        setError(error);
      }
    });
  }
  return handler;
}
