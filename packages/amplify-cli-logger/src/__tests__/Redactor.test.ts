import { Redactor } from '../Redactor';

describe('input-redaction', () => {
  const input = {
    categories: {
      notifications: {
        Pinpoint: {
          SMS: { Enabled: true },
          Email: {
            Enabled: true,
            // eslint-disable-next-line spellcheck/spell-checker
            FromAddress: 'xxx@amzon.com',
            Identity: 'identityArn',
            RoleArn: 'roleArn',
          },
          APNS: {
            Enabled: true,
            DefaultAuthenticationMethod: 'Certificate',
            P12FilePath: 'p12filePath',
            Password: 'p12FilePasswordIfAny',
          },
          // eslint-disable-next-line spellcheck/spell-checker
          FCM: { Enabled: true, ApiKey: 'fcmapikey' },
        },
      },
      auth: {
        resourceName: {
          hostedUIProviderCreds: '"ProviderName":"Facebook","client_id":"facebookClientIdTest","client_secret":"facebookClientSecretTest"',
        },
      },
    },
  };

  it('should redact argv and options', () => {
    const redactedInputString = Redactor(JSON.stringify(input));
    const redactedInput = JSON.parse(redactedInputString);
    const redactedPinpoint = redactedInput.categories.notifications.Pinpoint;
    const originalPinpoint = input.categories.notifications.Pinpoint;
    expect(redactedPinpoint.APNS.Password).not.toEqual(originalPinpoint.APNS.Password);
    expect(redactedPinpoint.Email.FromAddress).not.toEqual(originalPinpoint.Email.FromAddress);
    expect(redactedPinpoint.Email.Identity).not.toEqual(originalPinpoint.Email.Identity);
    expect(redactedPinpoint.Email.RoleArn).not.toEqual(originalPinpoint.Email.RoleArn);
    expect(redactedPinpoint.FCM.ApiKey).not.toEqual(originalPinpoint.FCM.ApiKey);

    const redactedAuth = redactedInput.categories.auth.resourceName;
    expect(redactedAuth.hostedUIProviderCreds).toMatchInlineSnapshot(
      `""ProviderName":"[***]book","client_id":"[***]ntIdTest","client_secret":"[***]SecretTest""`,
    );
  });

  it('redacts values containing punctuation characters', () => {
    const sensitive = { password: 'secret!?' };
    const redacted = JSON.parse(Redactor(JSON.stringify(sensitive)));
    expect(redacted.password.startsWith('[***]')).toBe(true);
    expect(redacted.password).not.toBe(sensitive.password);
  });
});
