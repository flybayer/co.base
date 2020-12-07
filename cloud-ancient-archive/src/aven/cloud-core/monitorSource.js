import cuid from 'cuid';

export default function monitorSource(source, logger) {
  function logEvent(eventName, details) {
    if (logger) {
      logger.log(eventName, details);
    }
  }

  function loggedDispatch(dispatch) {
    async function dispatchWithLogging(action) {
      const dispatchId = cuid();
      try {
        logEvent('DispatchStart', { action, time: Date.now(), dispatchId });
        const result = await dispatch(action);
        logEvent('DispatchSuccess', {
          action,
          result,
          time: Date.now(),
          dispatchId,
        });
        return result;
      } catch (e) {
        logEvent('DispatchError', { action, e, time: Date.now(), dispatchId });
        throw e;
      }
    }
    return dispatchWithLogging;
  }

  function observableWithLogging(observable, onEvent) {
    return {
      ...observable,
      subscribe: ({ next, complete, error }) => {
        const subscriberId = cuid();
        onEvent('Subscribe', { subscriberId });

        const sub = observable.subscribe({
          next: value => {
            onEvent('Next', { subscriberId, value });
            next(value);
          },
          complete: () => {
            onEvent('Complete', { subscriberId });
            complete();
          },
          error: e => {
            onEvent('Complete', { subscriberId, error: e });
          },
        });

        return {
          ...sub,
          unsubscribe: () => {
            onEvent('Unsubscribe', { subscriberId });
            sub.unsubscribe();
          },
        };
      },
    };
  }

  async function observeDoc(domain, name, auth) {
    const channelId = `Doc-${domain}-${name}-${cuid()}`;
    try {
      const obs = await source.observeDoc(domain, name, auth);
      return observableWithLogging(obs, (eventName, details) => {
        logEvent(`ObserveDoc${eventName}`, {
          ...details,
          channelId,
        });
      });
    } catch (error) {
      logEvent('ObserveDocError', { error, domain, name, auth, channelId });
    }
  }

  async function observeDocChildren(domain, name, auth) {
    const channelId = `DocChildren-${domain}-${name}-${cuid()}`;
    try {
      const obs = await source.observeDocChildren(domain, name, auth);
      return observableWithLogging(obs, (eventName, details) => {
        logEvent(`ObserveDocChildren${eventName}`, {
          ...details,
          channelId,
        });
      });
    } catch (error) {
      logEvent('ObserveDocChildrenError', {
        error,
        domain,
        name,
        auth,
        channelId,
      });
    }
  }
  return {
    ...source,
    dispatch: loggedDispatch(source.dispatch),
    observeDoc,
    observeDocChildren,
  };
}
