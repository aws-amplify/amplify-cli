import { v1toV2Upgrade } from '../authVersionUpgrades';

describe('v1toV2Upgrade', () => {
  it('bumps payload version to 2', () => {
    expect(v1toV2Upgrade({ version: 1 }).version).toBe(2);
  });

  it('maps email pwRecovery in service config to autoVerifiedAttributes', () => {
    const payload = {
      version: 1,
      serviceConfiguration: {
        userPoolConfiguration: {
          passwordRecovery: {
            deliveryMethod: 'EMAIL',
            emailMessage: 'test email message',
            emailSubject: 'test email subject',
          },
        },
      },
    };
    const result = v1toV2Upgrade(payload);
    expect(result).toEqual({
      version: 2,
      serviceConfiguration: {
        userPoolConfiguration: {
          autoVerifiedAttributes: [
            {
              type: 'EMAIL',
              verificationMessage: 'test email message',
              verificationSubject: 'test email subject',
            },
          ],
        },
      },
    });
  });

  it('maps sms pwRecovery in service config to autoVerifiedAttributes', () => {
    const payload = {
      version: 1,
      serviceConfiguration: {
        userPoolConfiguration: {
          passwordRecovery: {
            deliveryMethod: 'SMS',
            smsMessage: 'test sms message',
          },
        },
      },
    };
    const result = v1toV2Upgrade(payload);
    expect(result).toEqual({
      version: 2,
      serviceConfiguration: {
        userPoolConfiguration: {
          autoVerifiedAttributes: [
            {
              type: 'PHONE_NUMBER',
              verificationMessage: 'test sms message',
            },
          ],
        },
      },
    });
  });

  it('maps email pwRecovery in service modification to autoVerifiedAttributes', () => {
    const payload = {
      version: 1,
      serviceModification: {
        userPoolModification: {
          passwordRecovery: {
            deliveryMethod: 'EMAIL',
            emailMessage: 'test email message',
            emailSubject: 'test email subject',
          },
        },
      },
    };
    const result = v1toV2Upgrade(payload);
    expect(result).toEqual({
      version: 2,
      serviceModification: {
        userPoolModification: {
          autoVerifiedAttributes: [
            {
              type: 'EMAIL',
              verificationMessage: 'test email message',
              verificationSubject: 'test email subject',
            },
          ],
        },
      },
    });
  });

  it('maps sms pwRecovery in service modification to autoVerifiedAttributes', () => {
    const payload = {
      version: 1,
      serviceModification: {
        userPoolModification: {
          passwordRecovery: {
            deliveryMethod: 'SMS',
            smsMessage: 'test sms message',
          },
        },
      },
    };
    const result = v1toV2Upgrade(payload);
    expect(result).toEqual({
      version: 2,
      serviceModification: {
        userPoolModification: {
          autoVerifiedAttributes: [
            {
              type: 'PHONE_NUMBER',
              verificationMessage: 'test sms message',
            },
          ],
        },
      },
    });
  });

  it('bumps version with no other changes when service config does not contian pwRecovery', () => {
    const payload = {
      version: 1,
      serviceModification: {
        userPoolModification: {
          passwordPolicy: {
            test: 'test',
          },
        },
      },
    };
    const result = v1toV2Upgrade(payload);
    expect(result).toEqual({ ...payload, version: 2 });
  });
});
