import { ApiCategoryFacade, BannerMessage, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { SNS } from '../aws-utils/aws-sns';
import { showGraphQLTransformerVersion, showSMSSandboxWarning } from '../display-helpful-urls';
import { AwsError } from 'aws-sdk-client-mock';

jest.mock('../aws-utils/aws-sns');
jest.mock('@aws-amplify/amplify-cli-core');

const printerMock = printer as jest.Mocked<typeof printer>;
printerMock.info = jest.fn();
printerMock.warn = jest.fn();
printerMock.error = jest.fn();

describe('showGraphQLTransformerVersion', () => {
  const context = {};

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns early if there are no AppSync APIs', async () => {
    await showGraphQLTransformerVersion(context);
    expect(printerMock.info).not.toHaveBeenCalled();
  });

  it('prints the transformer version if there are AppSync APIs', async () => {
    (ApiCategoryFacade.getTransformerVersion as jest.Mock).mockReturnValueOnce(2);
    (stateManager.getMeta as jest.Mock).mockReturnValueOnce({
      api: { testapi: { service: 'AppSync' } },
    });

    await showGraphQLTransformerVersion(context);
    expect(printerMock.info).toHaveBeenCalledWith('GraphQL transformer version: 2');
  });
});

describe('showSMSSandBoxWarning', () => {
  const mockedGetMessage = jest.spyOn(BannerMessage, 'getMessage');
  const mockedSNSClientInstance = {
    isInSandboxMode: jest.fn(),
  };

  const context = {
    print: {
      warning: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(SNS, 'getInstance').mockResolvedValue(mockedSNSClientInstance as unknown as SNS);
  });

  describe('when API is missing in SDK', () => {
    beforeEach(() => {
      mockedSNSClientInstance.isInSandboxMode.mockRejectedValue(new TypeError());
    });

    it('should not show warning when SNS client is missing sandbox api and there is no banner message associated', async () => {
      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
      expect(printerMock.warn).not.toHaveBeenCalled();
    });

    it('should show warning when SNS Client is missing sandbox API and there is a banner message associated', async () => {
      const message = 'UPGRADE YOUR CLI!!!!';
      mockedGetMessage.mockImplementation(async (messageId) => (messageId === 'COGNITO_SMS_SANDBOX_UPDATE_WARNING' ? message : undefined));

      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
      expect(printerMock.warn).toHaveBeenCalledWith(message);
    });
  });

  describe('when IAM user is missing sandbox permission', () => {
    beforeEach(() => {
      const authError = new Error() as AwsError;
      authError.name = 'AuthorizationError';
      mockedSNSClientInstance.isInSandboxMode.mockRejectedValue(authError);
    });
    it('should not show any warning if there is no message associated', async () => {
      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_MISSING_PERMISSION');
      expect(printerMock.warn).not.toHaveBeenCalled();
    });

    it('should show any warning if there is no message associated', async () => {
      const message = 'UPDATE YOUR PROFILE USER WITH SANDBOX PERMISSION';

      mockedGetMessage.mockImplementation(async (messageId) => {
        switch (messageId) {
          case 'COGNITO_SMS_SANDBOX_MISSING_PERMISSION':
            return message;
          case 'COGNITO_SMS_SANDBOX_UPDATE_WARNING':
            return 'enabled';
        }
        return undefined;
      });

      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_MISSING_PERMISSION');
      expect(printerMock.warn).toHaveBeenCalledWith(message);
    });
  });

  describe('it should not show any warning message when the SNS API is not deployed', () => {
    beforeEach(() => {
      const resourceNotFoundError = new Error() as AwsError;
      resourceNotFoundError.name = 'ResourceNotFound';
      mockedSNSClientInstance.isInSandboxMode.mockRejectedValue(resourceNotFoundError);
    });
    it('should not print error', async () => {
      const message = 'UPGRADE YOUR CLI!!!!';
      mockedGetMessage.mockImplementation(async (messageId) => (messageId === 'COGNITO_SMS_SANDBOX_UPDATE_WARNING' ? message : undefined));

      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
      expect(printerMock.warn).not.toHaveBeenCalledWith(message);
    });
  });

  describe('it should not show any warning message when there is a network error', () => {
    beforeEach(() => {
      const networkError = new Error() as AwsError;
      networkError.name = 'UnknownEndpoint';
      mockedSNSClientInstance.isInSandboxMode.mockRejectedValue(networkError);
    });

    it('should not print error', async () => {
      const message = 'UPGRADE YOUR CLI!!!!';
      mockedGetMessage.mockImplementation(async (messageId) => (messageId === 'COGNITO_SMS_SANDBOX_UPDATE_WARNING' ? message : undefined));

      await showSMSSandboxWarning(context);

      expect(mockedGetMessage).toHaveBeenCalledWith('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
      expect(printerMock.warn).not.toHaveBeenCalledWith(message);
    });
  });
});
