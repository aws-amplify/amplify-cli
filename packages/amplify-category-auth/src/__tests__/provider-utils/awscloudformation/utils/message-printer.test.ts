import { doesConfigurationIncludeSMS, printSMSSandboxWarning } from '../../../../provider-utils/awscloudformation/utils/message-printer';
import { BannerMessage } from 'amplify-cli-core';
import { ServiceQuestionsResult } from '../../../../provider-utils/awscloudformation/service-walkthrough-types';
jest.mock('amplify-cli-core');
const printMock = {
  info: jest.fn(),
};

describe('printSMSSandboxWarning', () => {
  const mockedGetMessage = jest.spyOn(BannerMessage, 'getMessage');

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should print warning when the message is present', async () => {
    const message = 'BannerMessage';
    mockedGetMessage.mockResolvedValueOnce(message);
    await printSMSSandboxWarning(printMock);
    expect(printMock.info).toHaveBeenCalledWith(`${message}\n`);
    expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO');
  });

  it('should not print warning when the banner message is missing', async () => {
    mockedGetMessage.mockResolvedValueOnce(undefined);
    await printSMSSandboxWarning(printMock);
    expect(printMock.info).not.toHaveBeenCalled();
    expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO');
  });
});

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
