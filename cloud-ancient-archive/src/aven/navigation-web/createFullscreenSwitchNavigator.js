import React from 'react';
import { createSwitchNavigator } from '@aven/navigation-core';

export default function createFullscreenSwitchNavigator(routeConfig, options) {
  const SwitchNavigator = createSwitchNavigator(routeConfig, options);

  function FixedNavigator(props) {
    const { state } = props.navigation;
    const activeRoute = state.routes[state.index];
    React.useEffect(() => {
      global.window.scrollTo(0, 0);
    }, [
      // eslint-disable-next-line react-hooks/exhaustive-deps
      JSON.stringify(activeRoute),
    ]);
    return <SwitchNavigator {...props} />;
  }
  FixedNavigator.navigationOptions = SwitchNavigator.navigationOptions;
  FixedNavigator.router = SwitchNavigator.router;

  return FixedNavigator;
}
