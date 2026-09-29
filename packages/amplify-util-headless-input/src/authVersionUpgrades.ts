/**
 * In auth v2 payloads, passwordRecovery is removed and replaced with autoVerifiedAttributes
 * Password recovery was mistakenly included in the original version and was internally mapped to autoVerifiedAttributes.
 * This upgrade function maps the passwordRecovery config (if present) to the new autoVerifiedAttributes config
 * @param payload A v1 addAuth or updateAuth headless payload
 * @returns A v2 addAuth or updateAuth headless payload
 */
export const v1toV2Upgrade = (payload: any) => {
  payload.version = 2;
  const userPoolConfig = payload?.serviceConfiguration?.userPoolConfiguration || payload?.serviceModification?.userPoolModification;
  const pwRecoveryConfig = userPoolConfig?.passwordRecovery;
  if (!pwRecoveryConfig) {
    return payload;
  }
  // payload has pwRecoveryConfig
  switch (pwRecoveryConfig.deliveryMethod) {
    case 'EMAIL':
      userPoolConfig.autoVerifiedAttributes = [
        {
          type: 'EMAIL',
          verificationMessage: pwRecoveryConfig.emailMessage,
          verificationSubject: pwRecoveryConfig.emailSubject,
        },
      ];
      break;
    case 'SMS':
      userPoolConfig.autoVerifiedAttributes = [
        {
          type: 'PHONE_NUMBER',
          verificationMessage: pwRecoveryConfig.smsMessage,
        },
      ];
  }
  delete userPoolConfig.passwordRecovery;
  return payload;
};
