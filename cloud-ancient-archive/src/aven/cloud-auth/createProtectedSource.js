import { uuid, checksum, getAuthDocName } from '@aven/cloud-utils';
import { Err, createDispatcher } from '@aven/utils';
import { createProducerStream } from '@aven/stream';

export default function createProtectedSource({
  source,
  providers,
  parentAuth,
  staticPermissions,
}) {
  async function writeDocValue(source, domain, name, value) {
    await source.dispatch({
      type: 'PutDocValue',
      domain,
      value,
      name,
      auth: parentAuth,
    });
  }

  async function getDocValue(source, domain, name) {
    const r = await source.dispatch({
      domain,
      type: 'GetDocValue',
      name,
      auth: parentAuth,
    });
    return r && r.value;
  }
  async function getOptionalDocValue(source, domain, name) {
    try {
      const r = await source.dispatch({
        domain,
        type: 'GetDocValue',
        name,
        auth: parentAuth,
      });
      return r && r.value;
    } catch (e) {
      // its optional, baby!
      return null;
    }
  }

  async function VerifyAuth({ auth, domain }) {
    if (!auth) {
      return {};
    }
    if (auth.sessionId) {
      return await VerifySession({ auth, domain });
    }

    if (auth.accountId) {
      const v = await VerifyAuthProvider({
        verificationInfo: auth.verificationInfo,
        domain,
        accountId: auth.accountId,
        verificationResponse: auth.verificationResponse,
      });
      if (
        !v ||
        !v.accountId ||
        !v.verifiedProviderId ||
        !v.verifiedProviderName ||
        v.accountId !== auth.accountId
      ) {
        throw new Err('Cannot validate authentication', 'AuthInvalid', {});
      }
      return {
        accountId: v.accountId,
        provider: v.verifiedProviderName,
      };
    }

    return {};
  }

  async function VerifySession({ auth, domain }) {
    if (!auth || !auth.sessionId) {
      throw new Err('Cannot validate session', 'SessionInvalid', {});
    }
    const { accountId, sessionId, token } = auth;

    const savedSession = await getDocValue(
      source,
      domain,
      `auth/account/${accountId}/session/${sessionId}`,
    );

    if (!savedSession || savedSession.token !== token) {
      throw new Err('Cannot validate session', 'SessionInvalid', {});
    }

    return { ...savedSession, accountId };
  }

  async function GetAccountIdForAuthProvider({
    providerId,
    domain,
    accountId,
    onGetSuggestedId,
  }) {
    const providerAccountLookupName = `auth/provider/${providerId}`;
    const accountLookup = await getDocValue(
      source,
      domain,
      providerAccountLookupName,
    );
    if (accountLookup) {
      if (accountId && accountId !== accountLookup.accountId) {
        throw new Err(
          'Provided auth identity is already in use by another account.',
          'IdentityTaken',
          {},
        );
      }
      return accountLookup.accountId;
    }
    let newAuthProviderAccountId = accountId;
    if (!newAuthProviderAccountId) {
      newAuthProviderAccountId = await CreateAnonymousAccount({
        domain,
        onGetSuggestedId,
      });
    }
    const providerState = {
      accountId: newAuthProviderAccountId,
      creationTime: Date.now(),
    };
    await writeDocValue(
      source,
      domain,
      providerAccountLookupName,
      providerState,
    );
    return newAuthProviderAccountId;
  }

  async function CreateVerificationRequest({
    domain,
    accountId,
    verificationInfo,
  }) {
    let providersToValidate = [...providers];

    let validatedAccountId = null;

    while (providersToValidate.length && !validatedAccountId) {
      const providerToValidate = providersToValidate[0];
      providersToValidate = providersToValidate.slice(1);
      if (providerToValidate.canVerify(verificationInfo, accountId)) {
        const providerId = await providerToValidate.getProviderId(
          verificationInfo,
        );

        const authenticatingAccountId = await GetAccountIdForAuthProvider({
          providerId,
          accountId,
          domain,
          onGetSuggestedId: () => {
            if (providerToValidate.getSuggestedNameOfInfo) {
              return providerToValidate.getSuggestedNameOfInfo(
                verificationInfo,
              );
            }
            return null;
          },
        });

        const providerStateDocName = `auth/account/${authenticatingAccountId}/provider/${providerId}`;

        const providerState = await getDocValue(
          source,
          domain,
          providerStateDocName,
        );

        const requestedVerification = await providerToValidate.requestVerification(
          { verificationInfo, providerState },
        );

        await writeDocValue(
          source,
          domain,
          providerStateDocName,
          requestedVerification,
        );
        return {
          verificationChallenge: requestedVerification.verificationChallenge,
          providerId,
        };
      }
    }
    throw new Err('No auth provider matches this info and account!');
  }
  async function PutAuthProvider({
    domain,
    auth,
    verificationInfo,
    verificationResponse,
  }) {
    const verifiedSession = await VerifySession({ auth, domain });

    if (
      !verifiedSession ||
      !verifiedSession.accountId ||
      verifiedSession.accountId !== auth.accountId
    ) {
      throw new Err('not authenticated');
    }

    const authProviderVerification = await VerifyAuthProvider({
      accountId: verifiedSession.accountId,
      domain,
      verificationInfo,
      verificationResponse,
    });
    if (
      !authProviderVerification.accountId ||
      !authProviderVerification.verifiedProviderId ||
      !authProviderVerification.verifiedProviderName ||
      authProviderVerification.accountId !== verifiedSession.accountId
    ) {
      return authProviderVerification;
    }

    return authProviderVerification;
  }

  async function VerifyAuthProvider({
    domain,
    verificationInfo,
    verificationResponse,
    accountId,
  }) {
    let authenticatingAccountId = null;
    if (!verificationResponse) {
      return CreateVerificationRequest({ domain, accountId, verificationInfo });
    }

    let providersToValidate = [...providers];

    let verifiedProviderId = null;
    let verifiedProviderName = null;
    let verifiedAccountId = null;

    while (providersToValidate.length && !verifiedProviderId) {
      const providerToValidate = providersToValidate[0];
      providersToValidate = providersToValidate.slice(1);
      if (!providerToValidate.canVerify(verificationInfo, accountId)) {
        continue;
      }
      const providerId = await providerToValidate.getProviderId(
        verificationInfo,
      );

      authenticatingAccountId = await GetAccountIdForAuthProvider({
        domain,
        providerId,
        accountId,
      });

      const providerStateDocName = `auth/account/${authenticatingAccountId}/provider/${providerId}`;
      const providerState = await getDocValue(
        source,
        domain,
        providerStateDocName,
      );

      let nextproviderState = providerState;

      nextproviderState = await providerToValidate.performVerification({
        accountId: authenticatingAccountId,
        verificationInfo,
        providerState,
        verificationResponse,
      });
      verifiedProviderId = providerId;
      verifiedProviderName = providerToValidate.name;
      verifiedAccountId = authenticatingAccountId;

      if (nextproviderState !== providerState) {
        await writeDocValue(
          source,
          domain,
          providerStateDocName,
          nextproviderState,
        );
      }
    }

    if (!verifiedProviderId) {
      throw new Err('Provided authentication is invalid', 'InvalidAuth');
    }

    return {
      verifiedProviderName,
      verifiedProviderId,
      accountId: verifiedAccountId,
    };
  }

  async function CreateSession({
    domain,
    accountId,
    verificationInfo,
    verificationResponse,
  }) {
    const verification = await VerifyAuthProvider({
      domain,
      accountId,
      verificationInfo,
      verificationResponse,
    });
    if (
      !verification ||
      !verification.accountId ||
      !verification.verifiedProviderId ||
      !verification.verifiedProviderName ||
      (accountId && verification.accountId !== accountId)
    ) {
      return verification;
    }
    const sessionId = uuid();
    const token = await checksum(uuid());
    const session = {
      timeCreated: Date.now(),
      accountId: verification.accountId,
      sessionId,
      providerId: verification.verifiedProviderId,
      token,
      provider: verification.verifiedProviderName,
      verificationInfo,
    };
    await writeDocValue(
      source,
      domain,
      `auth/account/${verification.accountId}/session/${sessionId}`,
      session,
    );
    return {
      session,
    };
  }

  async function CreateAnonymousAccount({ domain, onGetSuggestedId }) {
    let accountId = onGetSuggestedId();
    const prevAccount = await getDocValue(
      source,
      domain,
      `auth/account/${accountId}`,
    );
    if (prevAccount) {
      accountId = uuid();
    }
    const account = {
      timeCreated: Date.now(),
    };
    await writeDocValue(source, domain, `auth/account/${accountId}`, account);
    return accountId;
  }

  async function CreateAnonymousSession({ domain }) {
    const accountId = await CreateAnonymousAccount({ domain });
    const sessionId = uuid();
    const token = await checksum(uuid());

    const session = {
      timeCreated: Date.now(),
      providerId: 'anonymous',
      accountId,
      sessionId,
      token,
    };

    await writeDocValue(
      source,
      domain,
      `auth/account/${accountId}/session/${sessionId}`,
      session,
    );

    return { session };
  }

  const Permissions = {
    none: {
      canRead: false,
      canTransact: false,
      canPost: false,
      canWrite: false,
      canAdmin: false,
    },
    admin: {
      canRead: true,
      canTransact: true,
      canPost: true,
      canWrite: true,
      canAdmin: true,
    },
  };
  const Rules = {
    empty: {
      canRead: null,
      canTransact: null,
      canPost: null,
      canWrite: null,
      canAdmin: null,
    },
  };
  const PermissionNames = [
    'canRead',
    'canTransact',
    'canPost',
    'canWrite',
    'canAdmin',
  ];

  function pathApartName(name) {
    if (!name) {
      return [];
    }
    const parts = name.split('/');
    return parts.map((p, index) => {
      return parts.slice(0, index + 1).join('/');
    });
  }

  function stripDocId(name) {
    const index = name.indexOf('#');
    if (index === -1) {
      return name;
    }
    return name.slice(0, index);
  }

  function nameToAuthDocName(name) {
    if (!name) {
      return '_auth';
    }
    if (name.endsWith('_auth')) {
      return name;
    }
    const lambdaNameParts = name.split('^');
    const primaryName = stripDocId(lambdaNameParts[0]);
    const lambdaNames = lambdaNameParts.slice(1).map(stripDocId);
    const docName = `${primaryName}/_auth${
      lambdaNames.length ? `_${lambdaNames.join('_')}` : ''
    }`;
    return docName;
  }

  function matchSelector(selector, validatedAuth) {
    switch (selector.type) {
      case 'EmailRegex': {
        const matcher = new RegExp(selector.emailRegexMatch);
        if (
          !validatedAuth ||
          validatedAuth.provider !== 'email' ||
          !validatedAuth.verificationInfo ||
          !validatedAuth.verificationInfo.email
        ) {
          return false;
        }
        if (validatedAuth.verificationInfo.email.match(matcher)) {
          return true;
        }
        return false;
      }
      default:
        return false;
    }
  }

  async function GetPermissions({ auth, name, domain }) {
    const validatedAuth = await VerifyAuth({ auth, domain });

    const isRootAccount =
      !!validatedAuth &&
      validatedAuth.provider === 'root' &&
      validatedAuth.accountId === 'root';

    if (name && name.indexOf('auth/') === 0) {
      return isRootAccount ? Permissions.admin : Permissions.none;
    }
    const staticPermissionSet = staticPermissions && staticPermissions[domain];
    const permissionBlocks = await Promise.all(
      pathApartName(name).map(async docName => {
        const staticPermissions =
          staticPermissionSet && staticPermissionSet[docName];
        if (staticPermissions) {
          return staticPermissions;
        }
        const authDocName = nameToAuthDocName(docName);
        return await getOptionalDocValue(source, domain, authDocName);
      }),
    );

    let owner = null;
    let userDoesOwn = false;

    const interpretedRule = {};

    function applyRule(permissionRule) {
      if (permissionRule == null) return;
      PermissionNames.forEach(permissionName => {
        const p = permissionRule[permissionName];
        if (interpretedRule[permissionName] == null) {
          interpretedRule[permissionName] = p;
        }
      });
    }
    let inheritedPermissions = null;
    permissionBlocks.forEach(permissions => {
      if (permissions && permissions.owner) {
        owner = permissions.owner;
        if (validatedAuth && permissions.owner === validatedAuth.accountId) {
          userDoesOwn = true;
        }
      }
      permissions &&
        permissions.defaultRule &&
        applyRule(permissions.defaultRule);
      inheritedPermissions &&
        inheritedPermissions.defaultRule &&
        applyRule(inheritedPermissions.defaultRule);
      inheritedPermissions = permissions ? permissions.children : null;
      permissions &&
        permissions.accountRules &&
        validatedAuth &&
        permissions.accountRules[validatedAuth.accountId] &&
        applyRule(permissions.accountRules[validatedAuth.accountId]);
      if (permissions && permissions.selector) {
        if (matchSelector(permissions.selector, validatedAuth)) {
          applyRule(permissions.selector.rule);
        }
      }
      if (inheritedPermissions && inheritedPermissions.selector) {
        if (matchSelector(inheritedPermissions.selector, validatedAuth)) {
          applyRule(inheritedPermissions.selector.rule);
        }
      }
    });

    if (isRootAccount || userDoesOwn) {
      return { ...Permissions.admin, owner };
    }

    if (
      // users can always read their own docs at /@username
      validatedAuth &&
      validatedAuth.accountId &&
      name.match(new RegExp(`^@${validatedAuth.accountId}\/`))
    ) {
      interpretedRule.canRead = true;
    }

    const finalPermissions = {
      owner,
      canRead:
        interpretedRule.canRead ||
        interpretedRule.canWrite ||
        interpretedRule.canAdmin ||
        false,
      canTransact:
        interpretedRule.canTransact || interpretedRule.canAdmin || false,
      canWrite: interpretedRule.canWrite || interpretedRule.canAdmin || false,
      canPost: interpretedRule.canPost || interpretedRule.canAdmin || false,
      canAdmin: interpretedRule.canAdmin || false,
    };
    if (
      finalPermissions.canRead ||
      finalPermissions.canPost ||
      finalPermissions.canTransact
    ) {
      return finalPermissions;
    } else {
      // avoid sending the 'owner' if the user is not even allowed to read or post
      return Permissions.none;
    }
  }

  async function SetAccountName({ name, auth, domain }) {
    const validated = await VerifySession({ auth, domain });

    if (!validated.accountId || validated.accountId !== auth.accountId) {
      throw new Err('Invalid authentication!', 'InvalidAuth');
    }

    await source.dispatch({
      type: 'MoveDoc',
      from: `auth/account/${validated.accountId}`,
      to: `auth/account/${name}`,
      domain,
      auth: parentAuth,
    });
  }

  async function DestroySession({ auth, domain }) {
    const validated = await VerifySession({ auth, domain });

    if (!validated.accountId || validated.accountId !== auth.accountId) {
      return false;
    }

    await source.dispatch({
      type: 'DestroyDoc',
      domain,
      name: `auth/account/${auth.accountId}/session/${auth.sessionId}`,
      auth: parentAuth,
    });
  }

  async function DestroyAllSessions({ auth, domain }) {
    const validated = await VerifySession({ auth, domain });

    if (!validated.accountId || validated.accountId !== auth.accountId) {
      return false;
    }

    await source.dispatch({
      type: 'DestroyDoc',
      domain,
      name: `auth/account/${auth.accountId}/session`,
      auth: parentAuth,
    });
  }

  async function DestroyAccount({ auth, domain }) {
    const validated = await VerifySession({ auth, domain });
    const docList = await source.dispatch({
      type: 'ListDocs',
      domain,
      parentName: `auth/account/${auth.accountId}/provider`,
      auth: parentAuth,
    });
    await Promise.all(
      docList.docs.map(async providerId => {
        const providerDocName = `auth/provider/${providerId}`;
        await source.dispatch({
          type: 'DestroyDoc',
          domain,
          name: providerDocName,
          auth: parentAuth,
        });
      }),
    );
    if (!validated.accountId || validated.accountId !== auth.accountId) {
      return false;
    }

    await source.dispatch({
      type: 'DestroyDoc',
      domain,
      name: `auth/account/${auth.accountId}`,
      auth: parentAuth,
    });
  }

  async function PutPermissionRules({
    auth,
    domain,
    name,
    accountRules,
    defaultRule,
  }) {
    const authDocName = nameToAuthDocName(name);

    const lastPermissions = await getDocValue(source, domain, authDocName);
    const lastDefaultRule =
      (lastPermissions && lastPermissions.defaultRule) || Rules.empty;
    const lastAccountRules =
      (lastPermissions && lastPermissions.accountRules) || {};

    const permissions = {
      ...lastPermissions,
      accountRules: {
        ...lastAccountRules,
        ...accountRules,
      },
      defaultRule: defaultRule || lastDefaultRule,
      lastWriteTime: Date.now(),
    };

    await writeDocValue(source, domain, authDocName, permissions);
  }

  async function GetPermissionRules({ domain, name }) {
    const authDocName = nameToAuthDocName(name);
    const lastPermissions = await getDocValue(source, domain, authDocName);
    return lastPermissions;
  }

  function getDocNameForAction(actionType, action) {
    if (actionType === 'ListDocs') {
      return action.parentName;
    }
    return action.name;
  }

  function guardAction(dispatch, actionType, permissionLevel) {
    return async action => {
      if (action.type !== actionType) {
        throw new Error(
          `Unexpected type "${action.type}" when guarding action "${actionType}"`,
        );
      }
      let docName = getDocNameForAction(actionType, action);
      let realPermissionLevelRequired = null;
      const authDocName = getAuthDocName(action.name);
      if (typeof authDocName === 'string') {
        docName = authDocName;
        realPermissionLevelRequired = 'canAdmin';
      }
      const p = await GetPermissions({
        auth: action.auth,
        name: docName,
        domain: action.domain,
      });
      if (
        !p[permissionLevel] ||
        (realPermissionLevelRequired && !p[realPermissionLevelRequired])
      ) {
        throw new Err(
          `Insufficient permissions for "${actionType}" on doc "${docName}". Requires "${permissionLevel}"`,
          'NoPermission',
          { actionType, docName, permissionLevel, domain: action.domain },
        );
      }
      const result = await dispatch({
        ...action,
        auth: parentAuth,
      });
      if (action.type === 'PostDoc' && result && action.auth) {
        const authDocName = nameToAuthDocName(result.name);
        await writeDocValue(source, action.domain, authDocName, {
          owner: action.auth.accountId,
        });
      }
      return result;
    };
  }

  const guardedActions = {};

  const readActions = ['GetBlock', 'GetDoc', 'GetDocValue', 'ListDocs'];
  const postActions = ['PostDoc'];
  const writeActions = ['PutDoc', 'PutDocValue'];
  const transactActions = ['PutTransactionValue', 'PutBlock'];
  const adminActions = ['DestroyDoc'];

  readActions.forEach(aName => {
    guardedActions[aName] = guardAction(source.dispatch, aName, 'canRead');
  });
  postActions.forEach(aName => {
    guardedActions[aName] = guardAction(source.dispatch, aName, 'canPost');
  });
  writeActions.forEach(aName => {
    guardedActions[aName] = guardAction(source.dispatch, aName, 'canWrite');
  });
  adminActions.forEach(aName => {
    guardedActions[aName] = guardAction(source.dispatch, aName, 'canAdmin');
  });
  transactActions.forEach(aName => {
    guardedActions[aName] = guardAction(source.dispatch, aName, 'canTransact');
  });

  const actions = {
    ...guardedActions,
    PutPermissionRules: guardAction(
      PutPermissionRules,
      'PutPermissionRules',
      'canAdmin',
    ),
    GetPermissionRules: guardAction(
      GetPermissionRules,
      'GetPermissionRules',
      'canAdmin',
    ),
    CreateSession,
    CreateAnonymousSession,
    DestroySession,
    // DestroyAllSessions, // implemented but not tested or used yet
    DestroyAccount,
    VerifySession,
    VerifyAuth,
    SetAccountName,
    PutAuthProvider, // todo, guard
    GetPermissions,
  };

  const sourceId = `protected(${source.id})`;

  const dispatch = createDispatcher(actions, source.dispatch, null, sourceId);

  async function observeDoc(domain, name, auth) {
    const permissions = await GetPermissions({ name, auth, domain });
    if (!permissions.canRead) {
      throw new Err(
        `Not authorized to subscribe to "${name}" as "${auth &&
          auth.accountId}"`,
        'NoPermission',
        {
          name,
          domain,
          authId: auth && auth.id,
        },
      );
    }
    return await source.observeDoc(domain, name, parentAuth);
  }

  function getDocStream(domain, name, auth) {
    let stopped = false;
    let upstreamRelease = null;
    return createProducerStream({
      crumb: { type: 'ProtectedDocStream', domain, name, auth },
      start: notify => {
        GetPermissions({ name, auth, domain })
          .then(permissions => {
            if (stopped) {
              return;
            }
            if (!permissions.canRead) {
              throw new Err(
                `Not authorized to subscribe to "${name}" as "${auth &&
                  auth.accountId}"`,
                'NoPermission',
                {
                  name,
                  domain,
                  authId: auth && auth.id,
                },
              );
            }
            const stream = source.getDocStream(domain, name, auth);
            if (!stream) {
              notify.error(new Err('NoSuchStream', { domain, name }));
              return;
            }
            stream.addListener(notify);
            upstreamRelease = () => stream.removeListener(notify);
          })
          .catch(err => {
            notify.error(err);
          });
      },
      stop: () => {
        stopped = true;
        upstreamRelease && upstreamRelease();
      },
    });
  }
  return {
    ...source,
    observeDoc,
    getDocStream,
    dispatch,
    close: () => {},
  };
}
