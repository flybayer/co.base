import React from 'react';
import { AppRegistry } from '@rn';
import { CloudContext } from '@aven/cloud';

export default function renderApp(App, { cloud, context, screenProps }) {
  function AppWithContext(props) {
    let el = <App {...props} />;
    if (cloud) {
      el = <CloudContext.Provider value={cloud}>{el}</CloudContext.Provider>;
    }
    context &&
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
