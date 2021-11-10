import { printSMSSandboxWarning } from '../../../../provider-utils/awscloudformation/utils/message-printer';
import { BannerMessage } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import os from 'os';
jest.mock('amplify-cli-core');

jest.mock('amplify-prompts');

describe('printSMSSandboxWarning', () => {
  const mockedGetMessage = jest.spyOn(BannerMessage, 'getMessage');

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should print warning when the message is present', async () => {
    const message = 'BannerMessage';
    mockedGetMessage.mockResolvedValueOnce(message);
    await printSMSSandboxWarning();
    expect(printer.warn).toHaveBeenCalledWith(`${message}${os.EOL}`);
    expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO');
  });

  it('should not print warning when the banner message is missing', async () => {
    mockedGetMessage.mockResolvedValueOnce(undefined);
    await printSMSSandboxWarning();
    expect(printer.warn).not.toHaveBeenCalled();
    expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO');
  });
});
