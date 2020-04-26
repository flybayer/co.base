import { ipcMain } from 'electron';

let dispatchTicker = 1;

export default function mainSourceProvider(channelId, getWindow, source) {
  const subs = {};

  function unsubscribeAll() {
    Object.keys(subs).forEach(subId => {
      subs[subId].unsubscribe();
    });
  }

  function close() {
    unsubscribeAll();
  }

  function windowSend(...args) {
    return getWindow().webContents.send(...args);
  }

  ipcMain.on(`${channelId}-Cloud-Subscribe`, (evt, action) => {
    const { subscriptions } = action;
    subscriptions.map(subscription => {
      const {
        id: subscriptionId,
        doc,
        docChildren,
        domain,
        auth,
      } = subscription;
      if (!subscriptionId) {
        throw new Error(
          'Can not subscribe without providing an id of the subscription.',
        );
      }
      if (doc !== undefined && docChildren !== undefined) {
        throw new Error(
          'Trying to subscribe to a doc and the children of a doc at the same time. Use seperate subscriptions instead.',
        );
      }
      function sendError(error) {
        console.error('Subscription Error', { ...subscription, error });
        windowSend(`${channelId}-Cloud-SubscriptionError`, {
          id: subscriptionId,
          error: {
            message: error.message,
            type: error.type,
            detail: error.detail,
          },
        });
      }
      function sendUpdate(value) {
        windowSend(`${channelId}-Cloud-SubscriptionNext`, {
          id: subscriptionId,
          value,
        });
      }
      const observer = {
        next: sendUpdate,
        complete: () => {
          // uh..
        },
        error: sendError,
      };
      if (doc) {
        const stream = source.getDocStream(domain, doc, auth);
        subs[subscriptionId] = {
          unsubscribe: () => {
            stream.removeListener(observer);
          },
        };
        stream.addListener(observer);
      } else if (docChildren !== undefined) {
        const stream = source.getDocChildrenEventStream(
          domain,
          docChildren,
          auth,
        );
        subs[subscriptionId] = {
          unsubscribe: () => {
            stream.removeListener(observer);
          },
        };
        stream.addListener(observer);
      } else {
        throw new Error(
          'Invalid subscription, should contain doc or docChildren',
        );
      }
    });
  });

  ipcMain.on(`${channelId}-Cloud-Unsubscribe`, (event, action) => {
    const { subscriptionIds } = action;
    subscriptionIds.forEach(subscriptionId => {
      subs[subscriptionId] && subs[subscriptionId].unsubscribe();
      delete subs[subscriptionId];
    });
  });

  ipcMain.on(`${channelId}-Cloud-Dispatch`, (event, action) => {
    const dispatchId = dispatchTicker;
    dispatchTicker += 1;
    event.returnValue = { dispatchId };
    source
      .dispatch(action)
      .then(response => {
        windowSend(`${channelId}-Cloud-DispatchResponse`, {
          dispatchId,
          response,
        });
      })
      .catch(error => {
        windowSend(`${channelId}-Cloud-DispatchResponse`, {
          dispatchId,
          error,
        });
      });
  });

  return {
    close,
    unsubscribeAll,
  };
}
