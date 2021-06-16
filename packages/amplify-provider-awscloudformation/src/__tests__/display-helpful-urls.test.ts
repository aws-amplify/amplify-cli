import { showSMSSandboxWarning } from '../display-helpful-urls';
import { BannerMessage } from 'amplify-cli-core';
import { SNS } from '../aws-utils/aws-sns';
import { AWSError } from 'aws-sdk';

jest.mock('../aws-utils/aws-sns');
jest.mock('amplify-cli-core');

describe('showSMSSandBoxWarning', () => {
  const mockedGetMessage = jest.spyOn(BannerMessage, 'getMessage');
  const mockedSNSClientInstance = {
    isInSandboxMode: jest.fn(),
  };

  let mockedSNSClass;
  const context = {
    print: {
      warning: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockedSNSClass = jest.spyOn(SNS, 'getInstance').mockResolvedValue((mockedSNSClientInstance as unknown) as SNS);
  });

  describe('when API is missing in SDK', () => {
    beforeEach(() => {
      mockedSNSClientInstance.isInSandboxMode.mockRejectedValue(new TypeError());
    });

    it('should not show warning when SNS client is missing sandbox api and there is no banner message associated', async () => {
      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
      expect(context.print.warning).not.toHaveBeenCalled();
    });

    it('should show warning when SNS Client is missing sandbox API and there is a banner message associated', async () => {
      const message = 'UPGRADE YOUR CLI!!!!';
      mockedGetMessage.mockImplementation(async messageId => (messageId === 'COGNITO_SMS_SANDBOX_UPDATE_WARNING' ? message : undefined));

      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
      expect(context.print.warning).toHaveBeenCalledWith(message);
    });
  });

  describe('when IAM user is missing sandbox permission', () => {
    beforeEach(() => {
      const authError = new Error() as AWSError;
      authError.code = 'AuthorizationError';
      mockedSNSClientInstance.isInSandboxMode.mockRejectedValue(authError);
    });
    it('should not show any warning if there is no message associated', async () => {
      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_MISSING_PERMISSION');
      expect(context.print.warning).not.toHaveBeenCalled();
    });

    it('should show any warning if there is no message associated', async () => {
      const message = 'UPDATE YOUR PROFILE USER WITH SANDBOX PERMISSION';

      mockedGetMessage.mockImplementation(async messageId => {
        switch (messageId) {
          case 'COGNITO_SMS_SANDBOX_MISSING_PERMISSION':
            return message;
          case 'COGNITO_SMS_SANDBOX_UPDATE_WARNING':
            return 'enabled';
        }
      });

      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_MISSING_PERMISSION');
      expect(context.print.warning).toHaveBeenCalledWith(message);
    });
  });

  describe('it should not show any warning message when the SNS API is not deployed', () => {
    beforeEach(() => {
      const resourceNotFoundError = new Error() as AWSError;
      resourceNotFoundError.code = 'ResourceNotFound';
      mockedSNSClientInstance.isInSandboxMode.mockRejectedValue(resourceNotFoundError);
    });
    it('should not print error', async () => {
      const message = 'UPGRADE YOUR CLI!!!!';
      mockedGetMessage.mockImplementation(async messageId => (messageId === 'COGNITO_SMS_SANDBOX_UPDATE_WARNING' ? message : undefined));

      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
      expect(context.print.warning).not.toHaveBeenCalledWith(message);
    });
  });

  describe('it should not show any warning message when there is a network error', () => {
    beforeEach(() => {
      const networkError = new Error() as AWSError;
      networkError.code = 'UnknownEndpoint';
      mockedSNSClientInstance.isInSandboxMode.mockRejectedValue(networkError);
    });

    it('should not print error', async () => {
      const message = 'UPGRADE YOUR CLI!!!!';
      mockedGetMessage.mockImplementation(async messageId => (messageId === 'COGNITO_SMS_SANDBOX_UPDATE_WARNING' ? message : undefined));

      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
      expect(context.print.warning).not.toHaveBeenCalledWith(message);
    });
  });
});
