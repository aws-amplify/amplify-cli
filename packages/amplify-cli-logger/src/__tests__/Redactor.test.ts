import _ from 'lodash';
import { Redactor } from '../Redactor';
describe('input-redaction', () => {
  const input = {
    categories: {
      notifications: {
        Pinpoint: {
          SMS: { Enabled: true },
          Email: { Enabled: true, FromAddress: 'xxx@amzon.com', Identity: 'identityArn', RoleArn: 'roleArn' },
          APNS: { Enabled: true, DefaultAuthenticationMethod: 'Certificate', P12FilePath: 'p12filePath', Password: 'p12FilePasswordIfAny' },
          FCM: { Enabled: true, ApiKey: 'fcmapikey' },
        },
      },
    },
  };

  it('should redact argv and options', () => {
    const redactedInputString = Redactor(JSON.stringify(input));
    const redactedInput = JSON.parse(redactedInputString);
    const path = ['categories', 'notifications', 'Pinpoint'];
    const redactedPinpoint = _.get(redactedInput, path);
    const originalPinpoint = _.get(input, path);
    expect(redactedPinpoint.APNS.Password).not.toEqual(originalPinpoint.APNS.Password);
    expect(redactedPinpoint.Email.FromAddress).not.toEqual(originalPinpoint.Email.FromAddress);
    expect(redactedPinpoint.Email.Identity).not.toEqual(originalPinpoint.Email.Identity);
    expect(redactedPinpoint.Email.RoleArn).not.toEqual(originalPinpoint.Email.RoleArn);
    expect(redactedPinpoint.FCM.ApiKey).not.toEqual(originalPinpoint.FCM.ApiKey);
  });
});
