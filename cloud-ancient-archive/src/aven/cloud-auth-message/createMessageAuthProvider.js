import { checksum, genAuthCode, genKey } from '@aven/cloud-utils';

export default function createMessageAuthProvider({
  authProviderName,
  sendVerification,
  identifyInfo,
  getSuggestedNameOfInfo,
  verificationExpirationHours = 2,
}) {
  function canVerify(verificationInfo) {
    if (identifyInfo(verificationInfo) === null) {
      return false;
    }
    return true;
  }

  async function getProviderId(verificationInfo) {
    return `${authProviderName}-${await checksum(
      identifyInfo(verificationInfo),
    )}`;
  }

  async function requestVerification({
    verificationInfo,
    providerState,
    accountId,
  }) {
    const verificationKey = await genAuthCode();

    // todo, check recent verification send time and avoid sending again
    await sendVerification(verificationInfo, verificationKey, accountId);

    const token = await genKey();

    return {
      ...providerState,
      verificationKey,
      verificationSendTime: Date.now(),
      challengeToken: token,
      verificationChallenge: {
        ...verificationInfo,
        token,
        hoursRemaining: verificationExpirationHours,
      },
      verificationInfo,
    };
  }

  async function performVerification({ providerState, verificationResponse }) {
    if (!providerState || !providerState.verificationKey) {
      throw new Error('Invalid auth verification');
    }
    // todo check expiry time
    const sendTime = providerState.verificationSendTime;
    const now = Date.now();
    if (sendTime + verificationExpirationHours * 60 * 60 * 1000 < now) {
      throw new Error('Auth verification expired');
    }
    if (verificationResponse.token !== providerState.challengeToken) {
      throw new Error('Invalid auth verification');
    }
    if (verificationResponse.key !== providerState.verificationKey) {
      throw new Error('Invalid auth verification');
    }
    return {
      ...providerState,
      verificationSendTime: null,
      lastVerificationTime: Date.now(),
      verificationKey: null,
    };
  }

  return {
    name: authProviderName,
    canVerify,
    requestVerification,
    performVerification,
    getProviderId,
    getSuggestedNameOfInfo,
  };
}
