import { Observable, BehaviorSubject, Subject } from 'rxjs-compat';
import ReconnectingWebSocket from 'reconnecting-websocket';

export default function createNativeNetworkSource(opts) {
  const httpEndpoint = `${opts.useSSL === false ? 'http' : 'https'}://${
    opts.authority
  }/dispatch`;
  const wsEndpoint = `${opts.useSSL === false ? 'ws' : 'wss'}://${
    opts.authority
  }`;
  const isConnected = new BehaviorSubject(false);
  const wsMessages = new Subject();

  let ws = null;
  let wsClientId = null;

  async function dispatch(action) {
    const res = await fetch(httpEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });

    if (res.status >= 400) {
      throw new Error(await res.text());
    }
    let result = await res.text();
    try {
      result = result.length ? JSON.parse(result) : null;
    } catch (e) {
      throw new Error('Expecting JSON but could not parse: ' + result);
    }
    console.log('📣', action);
    console.log('💨', result);

    return result;
  }

  function socketSendIfConnected(payload) {
    if (ws && ws.readyState === ReconnectingWebSocket.OPEN) {
      const msg = JSON.stringify({ ...payload, clientId: wsClientId });
      ws.send(msg);
    }
  }

  const docObservables = {};

  function createDomainDocObserver(domain, name, auth) {
    const domainDocObserver = {
      domain,
      name,
    };
    domainDocObserver.observable = Observable.create(observer => {
      if (domainDocObserver.onNext) {
        throw new Error(
          `Something has gone terribly wrong. There is somehow another observable already subscribed to the "${name}" doc on "${domain}"`
        );
      }
      domainDocObserver.onNext = val => observer.next(val);
      socketSendIfConnected({
        type: 'SubscribeDocs',
        docs: [name],
        domain,
        auth,
      });

      return () => {
        socketSendIfConnected({
          type: 'UnsubscribeDocs',
          docs: [name],
          domain,
        });
        delete docObservables[domain][name];
      };
    })
      .multicast(() => new BehaviorSubject(undefined))
      .refCount();
    return domainDocObserver;
  }

  function getDomainDocObserver(domain, name, auth) {
    const d = docObservables[domain] || (docObservables[domain] = {});
    const r =
      d[name] || (d[name] = createDomainDocObserver(domain, name, auth));
    return r;
  }

  function connectWS() {
    if (ws) {
      throw new Error('ws already here!');
    }
    ws = new ReconnectingWebSocket(wsEndpoint, [], {
      // debug: true,
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      minUptime: 5000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4000,
      maxRetries: Infinity,
    });

    wsClientId = null;
    ws.onopen = () => {
      // actually we're going to wait for the server to say hello with ClientId
    };
    ws.onclose = () => {
      isConnected.next(false);
    };
    ws.onerror = e => {
      isConnected.next(false);
    };
    ws.onmessage = msg => {
      const evt = JSON.parse(msg.data);
      switch (evt.type) {
        case 'ClientId': {
          wsClientId = evt.clientId;
          isConnected.next(true);
          Object.keys(docObservables).forEach(domain => {
            const docs = Object.keys(docObservables[domain]);
            socketSendIfConnected({
              type: 'SubscribeDocs',
              domain,
              docs,
            });
          });
          return;
        }
        case 'DocUpdate': {
          const o = getDomainDocObserver(evt.domain, evt.name);
          if (o && o.onNext) {
            o.onNext(evt);
          }
          return;
        }
        default: {
          wsMessages.next(evt);
          console.log('Unknown ws event:', evt);
          return;
        }
      }
    };
  }

  connectWS();

  async function observeDoc(domain, name, auth) {
    return getDomainDocObserver(domain, name, auth).observable;
  }

  return {
    dispatch,
    observeDoc,
    isConnected,
  };
}
