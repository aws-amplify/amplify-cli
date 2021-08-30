import { printSMSSandboxWarning } from '../../../../provider-utils/awscloudformation/utils/message-printer';
import { BannerMessage } from 'amplify-cli-core';
jest.mock('amplify-cli-core');
const printMock = {
  warning: jest.fn(),
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
    expect(printMock.warning).toHaveBeenCalledWith(`${message}\n`);
    expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO');
  });

  it('should not print warning when the banner message is missing', async () => {
    mockedGetMessage.mockResolvedValueOnce(undefined);
    await printSMSSandboxWarning(printMock);
    expect(printMock.warning).not.toHaveBeenCalled();
    expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO');
  });
});
