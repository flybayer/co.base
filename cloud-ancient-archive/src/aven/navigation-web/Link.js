import React, { Component } from 'react';
import { withNavigation, NavigationActions } from '@aven/navigation-core';

const queryString = require('query-string');

const getTopNavigation = navigation => {
  const parent = navigation.dangerouslyGetParent();
  if (parent) {
    return getTopNavigation(parent);
  }
  return navigation;
};

function getUrlAction(url) {
  if (url) {
    return NavigationActions.url(url);
  }
  return null;
}

class LinkWithNavigation extends Component {
  render() {
    const {
      children,
      params,
      routeName,
      routeKey,
      navigation,
      action,
      url,
      alternateActiveCheck,
      renderContent,
      target,
      overrideATagCSS, // ugh, escape hatches get long ugly names. css is applied directly, not RN style!
    } = this.props;
    const topNavigation = getTopNavigation(navigation);
    const topRouter = topNavigation.router;
    const navAction =
      action ||
      getUrlAction(url) ||
      NavigationActions.navigate({
        routeName,
        key: routeKey,
        params,
      });
    if (!action && !routeName && !routeKey && !url) {
      throw new Error(
        'Must provide a routeName, routeKey, url, or a navigation action prop to <Link>',
      );
    }
    if (action && routeKey) {
      throw new Error(
        'Cannot specify a conflicting "routeKey" and a navigation "action" prop. Either use routeName with routeKey to specify a navigate action, or provide the specific navigation "action" prop.',
      );
    }
    if (action && routeName) {
      throw new Error(
        'Cannot specify a conflicting "routeName" and a navigation "action" prop. Either use routeName with routeKey to specify a navigate action, or provide the specific navigation "action" prop.',
      );
    }
    const navActionResponse = topRouter.getStateForAction(
      navAction,
      topNavigation.state,
    );
    const nextState =
      navActionResponse === null ? topNavigation.state : navActionResponse;
    const pathAndParams = topRouter.getPathAndParamsForState(nextState);
    let href = url;
    if (!href) {
      href = Object.keys(pathAndParams.params).length
        ? `/${pathAndParams.path}?${queryString.stringify(
            pathAndParams.params,
          )}`
        : `/${pathAndParams.path}`;
    }
    const isActive =
      navActionResponse === null ||
      (alternateActiveCheck && alternateActiveCheck(navigation.state));
    return (
      <a
        style={{ textDecoration: 'none', color: 'inherit', ...overrideATagCSS }}
        href={href}
        onClick={e => {
          if (e.metaKey || navAction.type === NavigationActions.URL) {
            // correct behavior is default
          } else {
            navigation.dispatch(navAction);
            e.preventDefault();
          }
        }}
        target={target}
      >
        {renderContent ? renderContent(isActive) : children}
      </a>
    );
  }
}
const Link = withNavigation(LinkWithNavigation);

export default Link;
