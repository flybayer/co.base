/* eslint-env browser */

import { createBrowserHistory } from 'history';
import React from 'react';
import {
  NavigationActions,
  getNavigation,
  NavigationProvider,
} from '@aven/navigation-core';

const queryString = require('query-string');

const history = createBrowserHistory();

const getPathAndParamsFromLocation = location => {
  const path = encodeURI(location.pathname.substr(1));
  const params = queryString.parse(location.search);
  return { path, params };
};

const matchPathAndParams = (a, b) => {
  if (a.path !== b.path) {
    return false;
  }
  if (queryString.stringify(a.params) !== queryString.stringify(b.params)) {
    return false;
  }
  return true;
};

let currentPathAndParams = getPathAndParamsFromLocation(history.location);

function logNavigation(action, result, prevState) {
  if (process.env.REACT_NAV_LOGGING) {
    if (console.group) {
      console.group('Navigation Dispatch: ');
      console.log('Action: ', action);
      console.log('New State: ', result);
      console.log('Last State: ', prevState);
      console.groupEnd();
    } else {
      console.log('Navigation Dispatch: ', {
        action,
        newState: result,
        lastState: prevState,
      });
    }
    return;
  }
}

export default function createBrowserApp(App, screenProps) {
  const initAction =
    App.router.getActionForPathAndParams(
      currentPathAndParams.path,
      currentPathAndParams.params,
    ) || NavigationActions.init();
  const setHistoryListener = dispatch => {
    history.listen(location => {
      const pathAndParams = getPathAndParamsFromLocation(location);
      if (matchPathAndParams(pathAndParams, currentPathAndParams)) {
        return;
      }
      currentPathAndParams = pathAndParams;
      const action = App.router.getActionForPathAndParams(
        pathAndParams.path,
        pathAndParams.params,
      );
      if (action) {
        dispatch(action);
      } else {
        dispatch(initAction);
      }
    });
  };

  class WebApp extends React.Component {
    state = { nav: App.router.getStateForAction(initAction) };
    _title = document.title;
    _actionEventSubscribers = new Set();
    componentDidMount() {
      setHistoryListener(this._dispatch);
      this.updateTitle();
      this._actionEventSubscribers.forEach(subscriber =>
        subscriber({
          type: 'action',
          action: initAction,
          state: this.state.nav,
          lastState: null,
        }),
      );
    }
    componentDidUpdate() {
      this.updateTitle();
    }
    updateTitle() {
      const { state } = this._navigation;
      const childKey = state.routes[state.index].key;
      const activeNav = this._navigation.getChildNavigation(childKey);
      const opts = App.router.getScreenOptions(activeNav, screenProps);
      this._title = opts.title || opts.headerTitle;
      document.title = this._title;
    }
    render() {
      this._navigation = getNavigation(
        App.router,
        this.state.nav,
        this._dispatch,
        this._actionEventSubscribers,
        () => this.props.screenProps,
        () => this._navigation,
      );
      return (
        <NavigationProvider value={this._navigation}>
          <App navigation={this._navigation} />
        </NavigationProvider>
      );
    }
    _openUrl = url => {
      window.location = url;
      return null;
    };
    _dispatch = action => {
      const lastState = this.state.nav;
      if (action.type === NavigationActions.URL) {
        logNavigation(action, null, lastState);
        return this._openUrl(action.url);
      }
      const newState = App.router.getStateForAction(action, lastState);
      logNavigation(action, newState, lastState);

      const dispatchEvents = () =>
        this._actionEventSubscribers.forEach(subscriber =>
          subscriber({
            type: 'action',
            action,
            state: newState,
            lastState,
          }),
        );
      if (newState && newState !== lastState) {
        this.setState({ nav: newState }, dispatchEvents);
        const pathAndParams =
          App.router.getPathAndParamsForState &&
          App.router.getPathAndParamsForState(newState);
        if (
          pathAndParams &&
          !matchPathAndParams(pathAndParams, currentPathAndParams)
        ) {
          currentPathAndParams = pathAndParams;
          history.push(
            `/${pathAndParams.path}?${queryString.stringify(
              pathAndParams.params,
            )}`,
          );
        }
      } else {
        dispatchEvents();
      }
    };
  }
  return WebApp;
}
