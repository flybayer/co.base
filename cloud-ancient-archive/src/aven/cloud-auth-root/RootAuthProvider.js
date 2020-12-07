import { compareSecureString } from '@aven/cloud-utils';

export default function RootAuthProvider({ rootPasswordHash }) {
  function canVerify(verificationInfo, accountId) {
    if (verificationInfo.type === 'root') {
      return true;
    }
    if (accountId === 'root') {
      return true;
    }
    return false;
  }

  async function getProviderId() {
    return 'auth-root';
  }

  async function requestVerification({ verificationInfo, providerState }) {
    return {
      ...providerState,
      verificationChallenge: {
        message: 'Provide Password', // this isn't really used..
      },
      verificationInfo,
    };
  }

  async function performVerification({
    providerState,
    verificationResponse,
    accountId,
  }) {
    if (accountId !== 'root') {
      throw new Error('Invalid auth verification');
    }
    const { password } = verificationResponse;
    if (!password) {
      throw new Error(
        'no password provided in verificationResponse of performVerification',
      );
    }
    const isValid = await compareSecureString(password, rootPasswordHash);
    if (!isValid) {
      throw new Error('Invalid auth verification');
    }
    return {
      ...providerState,
    };
  }

  return {
    name: 'root',
    canVerify,
    requestVerification,
    performVerification,
    getProviderId,
  };
}
