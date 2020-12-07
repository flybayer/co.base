import React from 'react';
import { AppRegistry } from '@rn';
import { createBrowserApp } from '@aven/navigation-web-browser';

const emptyMap = new Map();

// welcome to the file that does the app's react-native-web and react-navigation jiggery pokery, so that most of the code below can be platform-agnostic

export default function startWebClient(App, context = emptyMap, screenProps) {
  if (window.remotePayload && screenProps.cloud) {
    screenProps.cloud.hydrate(window.remotePayload);
  }

  const AppWithNavigation = App.router
    ? createBrowserApp(App, screenProps)
    : App;

  function AppWithContext(props) {
    let el = <AppWithNavigation {...props} />;
    context.forEach((value, C) => {
      el = <C.Provider value={value}>{el}</C.Provider>;
    });
    return el;
  }

  AppRegistry.registerComponent('App', () => AppWithContext);

  AppRegistry.runApplication('App', {
    initialProps: {
      env: 'browser',
      screenProps,
    },
    rootTag: window.document.getElementById('root'),
  });
}
