import { streamOf } from '@aven/stream';
import createCloud from './createCloud';

export default function createClient({
  domain,
  source,
  onReport,
  onClientState,
  initialClientState = {},
}) {
  const [clientState, setClientState] = streamOf(
    initialClientState,
    'ClientStateStream',
  );

  let clientAuth = initialClientState.session || null;
  let sessionClient = createCloud({
    domain,
    source,
    auth: clientAuth,
    onReport,
  });

  clientState.addListener({
    next: state => {
      if (state !== initialClientState) {
        onClientState && onClientState(state);
      }
      if (state.session !== clientAuth) {
        clientAuth = state.session;
        sessionClient = createCloud({
          domain,
          source,
          auth: clientAuth,
        });
      }
    },
  });

  async function establishAnonymousSession() {
    if (clientState.session) {
      return clientState.session;
    }
    const created = await source.dispatch({
      type: 'CreateAnonymousSession',
      domain,
    });
    if (created && created.session) {
      setClientState({
        ...clientState.get(),
        session: created.session,
      });
    }
    return created;
  }

  async function login({ accountId, verificationInfo }) {
    const resp = await source.dispatch({
      type: 'CreateSession',
      domain,
      accountId,
      verificationInfo,
      verificationResponse: null,
    });
    if (resp && resp.verificationChallenge) {
      setClientState({
        ...clientState.get(),
        verification: resp.verificationChallenge,
        verificationInfo: verificationInfo,
        verificationAccountId: accountId,
      });
    }
    return resp;
  }

  async function logout() {
    const state = clientState.get();
    if (state.session) {
      await source.dispatch({
        type: 'DestroySession',
        domain,
        auth: state.session,
      });
    }
    setClientState({
      ...clientState.get(),
      session: null,
      verification: null,
      verificationInfo: null,
      verificationAccountId: null,
    });
  }

  async function cancelLogin() {
    setClientState({
      ...clientState.get(),
      verification: null,
      verificationInfo: null,
      verificationAccountId: null,
    });
  }

  async function destroyAccount() {
    const state = clientState.get();
    if (state.session) {
      await source.dispatch({
        type: 'DestroyAccount',
        domain,
        auth: state.session,
      });
      setClientState({
        ...clientState.get(),
        session: null,
        verification: null,
        verificationInfo: null,
        verificationAccountId: null,
      });
    }
  }

  async function verifyLogin({ code }) {
    const state = clientState.get();
    const verificationResponse = {
      token: state.verification.token,
      key: code,
    };
    const resp = await source.dispatch({
      type: 'CreateSession',
      domain,
      accountId: state.verificationAccountId,
      verificationInfo: state.verificationInfo,
      verificationResponse,
    });
    if (!resp.session) {
      console.error('resp', resp);
      throw new Error('No session returned');
    }
    setClientState({
      ...clientState.get(),
      session: resp.session,
      verification: null,
      verificationInfo: null,
    });
    return resp;
  }

  const cloudClient = {
    type: 'Client',
    establishAnonymousSession,
    getCloud: () => sessionClient,
    connected: source.connected,
    hydrate: (...args) => sessionClient.hydrate(...args),
    login,
    logout,
    destroyAccount,
    verifyLogin,
    cancelLogin,
    clientState,
    get: docName => sessionClient.get(docName),
  };

  return cloudClient;
}
