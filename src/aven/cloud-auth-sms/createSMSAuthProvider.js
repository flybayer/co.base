import { createMessageAuthProvider } from '@aven/cloud-auth-message';

function defaultGetMessage(verifyCode) {
  return `Your code is ${verifyCode}`;
}

export default function createSMSAuthProvider({ agent, getMessage }) {
  const authProviderName = 'sms';
  function identifyInfo(verificationInfo) {
    if (!verificationInfo || !verificationInfo.number) {
      return null;
    }
    return String(verificationInfo.number);
  }
  async function sendVerification(verificationInfo, verifyCode, accountId) {
    const message = getMessage
      ? await getMessage(verifyCode, verificationInfo, accountId)
      : await defaultGetMessage(verifyCode, verificationInfo, accountId);
    await agent.actions.SendSMS({
      to: verificationInfo.number,
      message,
    });
  }

  return createMessageAuthProvider({
    authProviderName,
    sendVerification,
    identifyInfo,
  });
}
