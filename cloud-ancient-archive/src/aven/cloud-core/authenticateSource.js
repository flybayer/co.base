export default function authenticateSource(
  source,
  authenticatedDomain,
  staticAuth,
) {
  function getDocStream(domain, name, auth) {
    if (auth || domain !== authenticatedDomain) {
      return source.getDocStream(domain, name, auth);
    }
    return source.getDocStream(domain, name, staticAuth);
  }

  function getDocChildrenEventStream(domain, name, auth) {
    if (auth || domain !== authenticatedDomain) {
      return source.getDocChildrenEventStream(domain, name, auth);
    }
    return source.getDocChildrenEventStream(domain, name, staticAuth);
  }

  async function dispatch(action) {
    if (action.auth || action.domain !== authenticatedDomain) {
      return await source.dispatch(action);
    }
    return await source.dispatch({ ...action, auth: staticAuth });
  }
  return {
    ...source,
    getDocStream,
    getDocChildrenEventStream,
    dispatch,
  };
}
