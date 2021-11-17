import { CognitoConfiguration } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';
import { FeatureFlags } from 'amplify-cli-core';
FeatureFlags.getBoolean = () => false;
import { AttributeType } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/cognito-user-input-types';
import { doesConfigurationIncludeSMS } from '../../../../provider-utils/awscloudformation/utils/auth-sms-workflow-helper';

describe('doesConfigurationIncludeSMS', () => {
  let request: CognitoConfiguration;

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
      userpoolClientGenerateSecret: false,
      userpoolClientLambdaRole: 'lambdarole',
      resourceName: 'resourceName',
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
    request.usernameAttributes = [AttributeType.PHONE_NUMBER];
    expect(doesConfigurationIncludeSMS(request)).toBeTruthy();
  });

  it('should return true when userNameAttribute contains phone number', () => {
    request.usernameAttributes = [AttributeType.EMAIL, AttributeType.PHONE_NUMBER] as any;
    expect(doesConfigurationIncludeSMS(request)).toBeTruthy();
  });

  it('should return false when username attribute does not contain phone number', () => {
    request.usernameAttributes = [AttributeType.EMAIL] as any;
    expect(doesConfigurationIncludeSMS(request)).toBeFalsy();
  });
});
