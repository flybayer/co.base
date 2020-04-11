import React from 'react';

export const HostContext = React.createContext();

export function HostContextContainer({ authority, useSSL, children }) {
  return (
    <HostContext.Provider value={{ authority, useSSL }}>
      {children}
    </HostContext.Provider>
  );
}
