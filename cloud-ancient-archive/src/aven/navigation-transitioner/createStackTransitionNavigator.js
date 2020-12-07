import { createNavigator, StackRouter } from '@aven/navigation-core';
import Transitioner from './Transitioner';

export default function createStackTransitionNavigator(
  routeConfigs,
  options = {},
) {
  if (options.ContainerView && options.navigationOptions) {
    throw new Error(
      'Cannot create a transition navigator with both ContainerView.navigationOptions and navigationOptions. Please define the options statically on the ContainerView',
    );
  }
  const config = options.ContainerView
    ? { ...options, navigationOptions: options.ContainerView.navigationOptions }
    : options;
  const router = StackRouter(routeConfigs, config);

  return createNavigator(Transitioner, router, config);
}
