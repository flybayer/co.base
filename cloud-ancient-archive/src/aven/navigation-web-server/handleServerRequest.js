import { NavigationActions, getNavigation } from '@aven/navigation-core';

export default async function handleServerRequest(
  Router,
  pathWithLeadingSlash,
  query,
  screenProps,
) {
  const path = pathWithLeadingSlash.slice(1);

  // Get initial action from the URL
  const navigationAction =
    Router.getActionForPathAndParams(path, query) || NavigationActions.init();

  // Get state from reducer
  const navigationState = Router.getStateForAction(navigationAction);

  const actionSubscribers = new Set();

  // Prepare top-level navigation prop
  let navigation = null;
  function getCurrentNavigation() {
    return navigation;
  }

  navigation = getNavigation(
    Router,
    navigationState,
    () => {},
    actionSubscribers,
    () => ({}),
    getCurrentNavigation,
  );

  // Get title from active screen options
  const activeKey = navigationState.routes[navigationState.index].key;
  const activeChildNavigation = navigation.getChildNavigation(activeKey);

  const preOptions = Router.getScreenOptions(
    activeChildNavigation,
    screenProps,
  );
  let dataPayload = null;
  if (preOptions.loadData) {
    dataPayload = await preOptions.loadData();
  }
  const options = Router.getScreenOptions(activeChildNavigation, screenProps);

  const title = options.title || options.headerTitle;

  return { navigation, title, options, dataPayload };
}
