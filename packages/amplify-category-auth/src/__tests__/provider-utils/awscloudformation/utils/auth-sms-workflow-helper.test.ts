import { ServiceQuestionsResult } from '../../../../provider-utils/awscloudformation/service-walkthrough-types';
import { doesConfigurationIncludeSMS } from '../../../../provider-utils/awscloudformation/utils/auth-sms-workflow-helper';

describe('doesConfigurationIncludeSMS', () => {
  let request: ServiceQuestionsResult;

  beforeEach(() => {
    request = {
      adminQueries: false,
      authProviders: [],
      authSelections: 'identityPoolAndUserPool',
      autoVerifiedAttributes: [],
      mfaConfiguration: 'OFF',
      requiredAttributes: [],
      serviceName: 'Cognito',
      usernameAttributes: [],
      thirdPartyAuth: false,
      useDefault: 'default',
      userPoolGroups: false,
      userpoolClientReadAttributes: [],
      userpoolClientWriteAttributes: [],
    };
  });

  it('should return true when MFA is optional and SMS text Message is enabled', () => {
    request.mfaConfiguration = 'OPTIONAL';
    request.mfaTypes = ['SMS Text Message', 'TOTP'];
    expect(doesConfigurationIncludeSMS(request)).toBeTruthy();
  });

  it('should return true when MFA is ON and SMS text Message is enabled', () => {
    request.mfaConfiguration = 'ON';
    request.mfaTypes = ['SMS Text Message', 'TOTP'];
    expect(doesConfigurationIncludeSMS(request)).toBeTruthy();
  });

  it('should return false when MFA is on and SMS Text message is not enabled', () => {
    request.mfaConfiguration = 'ON';
    request.mfaTypes = ['TOTP'];
    expect(doesConfigurationIncludeSMS(request)).toBeFalsy();
  });

  it('should return false when MFA OFF', () => {
    request.mfaConfiguration = 'OFF';
    request.mfaTypes = ['TOTP', 'SMS Text Message'];
    expect(doesConfigurationIncludeSMS(request)).toBeFalsy();
  });

  it('should return true when userNameAttribute contains phone number', () => {
    request.usernameAttributes = ['phone_number'];
    expect(doesConfigurationIncludeSMS(request)).toBeTruthy();
  });

  it('should return true when userNameAttribute contains phone number', () => {
    request.usernameAttributes = ['email, phone_number'] as any;
    expect(doesConfigurationIncludeSMS(request)).toBeTruthy();
  });

  it('should return false when username attribute does not contain phone number', () => {
    request.usernameAttributes = ['email'] as any;
    expect(doesConfigurationIncludeSMS(request)).toBeFalsy();
  });
});
