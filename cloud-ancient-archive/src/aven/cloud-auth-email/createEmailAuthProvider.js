import { createMessageAuthProvider } from '@aven/cloud-auth-message';

function defaultGetMessage(verifyCode) {
  return {
    message: `Your verification code is ${verifyCode}`,
    subject: 'Welcome!',
  };
}

export default function createEmailAuthProvider({
  agent,
  getMessage,
  acceptableEmailRegex,
}) {
  const authProviderName = 'email';
  function identifyInfo(verificationInfo) {
    if (!verificationInfo || !verificationInfo.email) {
      return null;
    }
    if (acceptableEmailRegex) {
      if (!verificationInfo.email.match(acceptableEmailRegex)) {
        return null;
      }
    }
    return String(verificationInfo.email);
  }
  async function sendVerification(verificationInfo, verifyCode, accountId) {
    const { subject, message } = getMessage
      ? await getMessage(verifyCode, verificationInfo, accountId)
      : await defaultGetMessage(verifyCode, verificationInfo, accountId);

    await agent.actions.SendEmail({
      to: verificationInfo.email,
      subject,
      message,
    });
  }

  function getSuggestedNameOfInfo(verificationInfo) {
    const match = verificationInfo.email.match(/([^@].*)@/);
    if (match) {
      return match[1];
    }
    return null;
  }

  return createMessageAuthProvider({
    getSuggestedNameOfInfo,
    authProviderName,
    sendVerification,
    identifyInfo,
  });
}
