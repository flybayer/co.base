import createMemoryStorageSource from '../../cloud-core/createMemoryStorageSource';
import createProtectedSource from '../createProtectedSource';
import RootAuthProvider from '../../cloud-auth-root/RootAuthProvider';

import { hashSecureString } from '../../cloud-utils/Crypto';

describe('Cloud auth sessions', () => {
  it('gets root authentication', async () => {
    const source = createMemoryStorageSource({ domain: 'test' });
    const password = 'secret, foo';
    const rootPasswordHash = await hashSecureString(password);
    const rootProvider = RootAuthProvider({
      rootPasswordHash,
    });

    const protectedSource = createProtectedSource({
      source,
      providers: [rootProvider],
    });

    const { session } = await protectedSource.dispatch({
      type: 'CreateSession',
      domain: 'test',
      verificationInfo: {
        type: 'root',
      },
      accountId: 'root',
      verificationResponse: { password },
    });

    expect(typeof session.token).toEqual('string');
    expect(typeof session.sessionId).toEqual('string');
    expect(typeof session.accountId).toEqual('string');

    const v = await protectedSource.dispatch({
      type: 'VerifySession',
      auth: session,
      domain: 'test',
    });

    expect(v.accountId).toEqual('root');
  });

  it('no authentication gets empty permissions at root', async () => {
    const source = createMemoryStorageSource({ domain: 'test' });

    const protectedSource = createProtectedSource({ source, providers: [] });

    const noAuthRootPermissions = await protectedSource.dispatch({
      type: 'GetPermissions',
      auth: null,
      domain: 'test',
      name: null,
    });

    expect(noAuthRootPermissions.canRead).toEqual(false);
    expect(noAuthRootPermissions.canPost).toEqual(false);
    expect(noAuthRootPermissions.canWrite).toEqual(false);
    expect(noAuthRootPermissions.canAdmin).toEqual(false);
  });

  it('root authentication gets full permissions of domain', async () => {
    const source = createMemoryStorageSource({ domain: 'test' });

    const password = 'secret, foo';
    const rootPasswordHash = await hashSecureString(password);
    const rootProvider = RootAuthProvider({
      rootPasswordHash,
    });

    const protectedSource = createProtectedSource({
      source,
      providers: [rootProvider],
    });

    const { session } = await protectedSource.dispatch({
      type: 'CreateSession',
      domain: 'test',
      verificationInfo: {
        type: 'root',
      },
      accountId: 'root',
      verificationResponse: { password },
    });

    const rootPermissions = await protectedSource.dispatch({
      type: 'GetPermissions',
      auth: session,
      domain: 'test',
      name: null,
    });

    expect(rootPermissions.canRead).toEqual(true);
    expect(rootPermissions.canPost).toEqual(true);
    expect(rootPermissions.canWrite).toEqual(true);
    expect(rootPermissions.canAdmin).toEqual(true);
  });

  it('log out via destroy session', async () => {
    const source = createMemoryStorageSource({ domain: 'test' });

    const password = 'secret, foo';
    const rootPasswordHash = await hashSecureString(password);
    const rootProvider = RootAuthProvider({
      rootPasswordHash,
    });

    const protectedSource = createProtectedSource({
      source,
      providers: [rootProvider],
    });

    const { session } = await protectedSource.dispatch({
      type: 'CreateSession',
      domain: 'test',
      verificationInfo: {
        type: 'root',
      },
      accountId: 'root',
      verificationResponse: { password },
    });

    await protectedSource.dispatch({
      type: 'DestroySession',
      auth: session,
      domain: 'test',
    });

    await expect(
      protectedSource.dispatch({
        type: 'GetPermissions',
        auth: session,
        domain: 'test',
        name: null,
      }),
    ).rejects.toThrow();
  });

  it('gets anon authentication', async () => {
    const source = createMemoryStorageSource({ domain: 'test' });

    const protectedSource = createProtectedSource({ source, providers: [] });

    const { session } = await protectedSource.dispatch({
      type: 'CreateAnonymousSession',
      domain: 'test',
    });

    expect(typeof session.token).toEqual('string');
    expect(typeof session.sessionId).toEqual('string');
    expect(typeof session.accountId).toEqual('string');
  });
});
