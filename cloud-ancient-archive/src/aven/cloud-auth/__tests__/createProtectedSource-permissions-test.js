import createMemoryStorageSource from '../../cloud-core/createMemoryStorageSource';
import createProtectedSource from '../createProtectedSource';
import RootAuthProvider from '../../cloud-auth-root/RootAuthProvider';

import { hashSecureString } from '../../cloud-utils/Crypto';

async function establishPermissionsTestData() {
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

  const anonSessionCreated = await protectedSource.dispatch({
    type: 'CreateAnonymousSession',
    domain: 'test',
  });
  const anonSession = anonSessionCreated.session;
  const anonSession2Created = await protectedSource.dispatch({
    type: 'CreateAnonymousSession',
    domain: 'test',
  });
  const anonSession2 = anonSession2Created.session;
  const rootSessionCreated = await protectedSource.dispatch({
    type: 'CreateSession',
    domain: 'test',
    verificationInfo: {
      type: 'root',
    },
    accountId: 'root',
    verificationResponse: { password },
  });
  const rootSession = rootSessionCreated.session;

  const barBlock = await protectedSource.dispatch({
    type: 'PutDocValue',
    auth: rootSession,
    domain: 'test',
    name: 'something',
    value: { foo: 'baz' },
  });
  const fooBlock = await protectedSource.dispatch({
    type: 'PutDocValue',
    auth: rootSession,
    domain: 'test',
    name: 'something',
    value: { foo: 'bar' },
  });

  return {
    fooBlock,
    barBlock,
    protectedSource,
    rootSession,
    anonSession,
    anonSession2,
  };
}

describe('Cloud auth Permissions', () => {
  it('permissions are roughly respected', async () => {
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

    await expect(
      protectedSource.dispatch({
        type: 'PutDoc',
        auth: null,
        domain: 'test',
        name: 'something',
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutDoc',
      auth: session,
      domain: 'test',
      name: 'something',
      id: null,
    });
  });

  it('default read permission', async () => {
    const {
      fooBlock,
      barBlock,
      rootSession,
      anonSession,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await expect(
      protectedSource.dispatch({
        type: 'GetDoc',
        auth: anonSession,
        domain: 'test',
        name: 'something',
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'something',
      defaultRule: {
        canRead: true,
      },
    });

    result = await protectedSource.dispatch({
      type: 'GetDoc',
      auth: anonSession,
      domain: 'test',
      name: 'something',
    });
    expect(result.id).toEqual(fooBlock.id);

    result = await protectedSource.dispatch({
      type: 'GetBlock',
      auth: anonSession,
      domain: 'test',
      name: 'something',
      id: result.id,
    });
    expect(result.value.foo).toEqual('bar');
  });

  it('account read permission', async () => {
    const {
      fooBlock,
      barBlock,
      rootSession,
      anonSession,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await expect(
      protectedSource.dispatch({
        type: 'GetDoc',
        auth: anonSession,
        domain: 'test',
        name: 'something',
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'something',
      defaultRule: {},
      accountRules: {
        [anonSession.accountId]: {
          canRead: true,
        },
      },
    });

    result = await protectedSource.dispatch({
      type: 'GetDoc',
      auth: anonSession,
      domain: 'test',
      name: 'something',
    });
    expect(result.id).toEqual(fooBlock.id);

    result = await protectedSource.dispatch({
      type: 'GetBlock',
      auth: anonSession,
      domain: 'test',
      name: 'something',
      id: result.id,
    });
    expect(result.value.foo).toEqual('bar');
    await expect(
      protectedSource.dispatch({
        type: 'GetDoc',
        domain: 'test',
        name: 'something',
      }),
    ).rejects.toThrow();
  });

  it('anon session post permission', async () => {
    const {
      rootSession,
      anonSession,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await expect(
      protectedSource.dispatch({
        type: 'PostDoc',
        auth: anonSession,
        domain: 'test',
        name: 'something',
        value: { foo: 'bar' },
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'something',
      defaultRule: {
        canPost: true,
      },
    });

    const postResult = await protectedSource.dispatch({
      type: 'PostDoc',
      auth: anonSession,
      domain: 'test',
      name: 'something',
      value: { foo: 'bar' },
    });
    expect(postResult.name).toMatch(/^something\//);
  });

  it('permissions cascade properly', async () => {
    const {
      rootSession,
      anonSession,
      protectedSource,
    } = await establishPermissionsTestData();
    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'great',
      defaultRule: {
        canPost: true,
      },
    });
    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'great/news',
      defaultRule: {
        canWrite: true,
      },
    });
    const p1 = await protectedSource.dispatch({
      type: 'GetPermissions',
      auth: anonSession,
      domain: 'test',
      name: 'great',
    });
    expect(p1).toEqual({
      canRead: false,
      canPost: true,
      canWrite: false,
      canAdmin: false,
      owner: null,
    });
    const p2 = await protectedSource.dispatch({
      type: 'GetPermissions',
      auth: anonSession,
      domain: 'test',
      name: 'great/news',
    });
    expect(p2).toEqual({
      canRead: true,
      canPost: true,
      canWrite: true,
      canAdmin: false,
      owner: null,
    });
  });

  it('posted doc ownership', async () => {
    const {
      rootSession,
      anonSession,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'something',
      defaultRule: {
        canPost: true,
      },
    });

    const postResult = await protectedSource.dispatch({
      type: 'PostDoc',
      auth: anonSession,
      domain: 'test',
      name: 'something',
      value: { foo: 'bar' },
    });

    const perms = await protectedSource.dispatch({
      type: 'GetPermissions',
      auth: anonSession,
      domain: 'test',
      name: postResult.name,
    });
    expect(perms).toEqual({
      canRead: true,
      canWrite: true,
      canPost: true,
      canAdmin: true,
      canTransact: true,
      owner: anonSession.accountId,
    });
    const childPerms = await protectedSource.dispatch({
      type: 'GetPermissions',
      auth: anonSession,
      domain: 'test',
      name: postResult.name + '/foo',
    });
    expect(childPerms).toEqual({
      canRead: true,
      canWrite: true,
      canPost: true,
      canAdmin: true,
      canTransact: true,
      owner: anonSession.accountId,
    });
  });
  it('account write permission', async () => {
    const {
      fooBlock,
      barBlock,
      rootSession,
      anonSession,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await expect(
      protectedSource.dispatch({
        type: 'GetDoc',
        auth: anonSession,
        domain: 'test',
        name: 'something',
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'something',
      defaultRule: {},
      accountRules: {
        [anonSession.accountId]: {
          canWrite: true,
        },
      },
    });

    await expect(
      protectedSource.dispatch({
        type: 'GetDoc',
        domain: 'test',
        name: 'something',
      }),
    ).rejects.toThrow();

    await expect(
      protectedSource.dispatch({
        type: 'PutDoc',
        domain: 'test',
        name: 'something',
        id: barBlock.id,
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutDoc',
      auth: anonSession,
      domain: 'test',
      name: 'something',
      id: barBlock.id,
    });

    result = await protectedSource.dispatch({
      type: 'GetDoc',
      auth: anonSession,
      domain: 'test',
      name: 'something',
    });
    expect(result.id).toEqual(barBlock.id);
  });

  it('account admin permission for PutPermissionRules', async () => {
    const {
      fooBlock,
      barBlock,
      rootSession,
      anonSession,
      anonSession2,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await expect(
      protectedSource.dispatch({
        type: 'PutPermissionRules',
        auth: anonSession,
        domain: 'test',
        name: 'something',
        defaultRule: {},
        accountRules: {},
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'something',
      defaultRule: {},
      accountRules: {
        [anonSession.accountId]: {
          canAdmin: true,
        },
      },
    });

    await expect(
      protectedSource.dispatch({
        type: 'GetDoc',
        auth: anonSession2,
        domain: 'test',
        name: 'something',
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: anonSession,
      domain: 'test',
      name: 'something',
      defaultRule: {},
      accountRules: {
        [anonSession.accountId]: {
          canAdmin: true,
        },
        [anonSession2.accountId]: {
          canRead: true,
        },
      },
    });

    result = await protectedSource.dispatch({
      type: 'GetDoc',
      auth: anonSession2,
      domain: 'test',
      name: 'something',
    });
    expect(result.id).toEqual(fooBlock.id);
  });

  it('account admin permission for GetPermissionRules', async () => {
    const {
      fooBlock,
      barBlock,
      rootSession,
      anonSession,
      anonSession2,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await expect(
      protectedSource.dispatch({
        type: 'GetPermissionRules',
        auth: anonSession,
        domain: 'test',
        name: 'something',
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'something',
      defaultRule: {
        canRead: true,
      },
      accountRules: {
        [anonSession.accountId]: {
          canAdmin: true,
        },
      },
    });

    result = await protectedSource.dispatch({
      type: 'GetPermissionRules',
      auth: anonSession,
      domain: 'test',
      name: 'something',
    });

    expect(result.defaultRule.canRead).toEqual(true);
  });

  it('account admin permission for getting _auth', async () => {
    const {
      fooBlock,
      barBlock,
      rootSession,
      anonSession,
      anonSession2,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await expect(
      protectedSource.dispatch({
        type: 'GetDocValue',
        auth: anonSession,
        domain: 'test',
        name: 'something/_auth',
      }),
    ).rejects.toThrow();

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: 'something',
      defaultRule: {
        canRead: true,
      },
      accountRules: {
        [anonSession.accountId]: {
          canAdmin: true,
        },
      },
    });

    result = await protectedSource.dispatch({
      type: 'GetDocValue',
      auth: anonSession,
      domain: 'test',
      name: 'something/_auth',
    });

    expect(result.value.defaultRule).toEqual({
      canRead: true,
    });
    expect(result.value.accountRules).toEqual({
      [anonSession.accountId]: {
        canAdmin: true,
      },
    });
  });

  it('root permission allows getting _auth', async () => {
    const {
      fooBlock,
      barBlock,
      rootSession,
      anonSession,
      anonSession2,
      protectedSource,
    } = await establishPermissionsTestData();

    let result = null;

    await expect(
      protectedSource.dispatch({
        type: 'GetDocValue',
        auth: anonSession,
        domain: 'test',
        name: '_auth',
      }),
    ).rejects.toThrow();

    result = await protectedSource.dispatch({
      type: 'GetDocValue',
      auth: rootSession,
      domain: 'test',
      name: '_auth',
    });

    expect(result.value).toEqual(undefined);

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      name: '',
      defaultRule: {
        canRead: true,
      },
      accountRules: {},
    });

    result = await protectedSource.dispatch({
      type: 'GetDocValue',
      auth: rootSession,
      domain: 'test',
      name: '_auth',
    });

    expect(result.value.defaultRule).toEqual({
      canRead: true,
    });

    await protectedSource.dispatch({
      type: 'PutPermissionRules',
      auth: rootSession,
      domain: 'test',
      //name: null, // null, undefined, and empty string mean the same thing for PutPermissionRules
      defaultRule: {
        canRead: false,
      },
      accountRules: {},
    });

    result = await protectedSource.dispatch({
      type: 'GetDocValue',
      auth: rootSession,
      domain: 'test',
      name: '_auth',
    });

    expect(result.value.defaultRule).toEqual({
      canRead: false,
    });
  });
});
