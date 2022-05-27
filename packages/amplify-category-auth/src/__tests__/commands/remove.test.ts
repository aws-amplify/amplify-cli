import * as remove from '../../commands/auth/remove';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

jest.mock('amplify-prompts', () => ({
  printer: {
    info: jest.fn(),
  },
}));

const saveCLIInputPayload_mock = jest.fn();

jest.mock('fs-extra');

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state', () => {
  return {
    AuthInputState: jest.fn().mockImplementation(() => {
      return {
        isCLIInputsValid: jest.fn(),
        getCLIInputPayload: jest.fn().mockImplementation(() => ({
          cognitoConfig: {
            userPoolGroupList: ['admin'],
          },
        })),
        saveCLIInputPayload: saveCLIInputPayload_mock,
      };
    }),
  };
});

jest.mock('amplify-cli-core', () => ({
  AmplifySupportedService: {
    AUTH: 'Cognito',
    COGNITOUSERPOOLGROUPS: 'Cognito-UserPool-Groups',
  },
  stateManager: {
    getMeta: jest
      .fn()
      .mockReturnValueOnce({
        analytics: {
          mockResource1: {},
        },
        api: {
          mockResource1: {},
        },
        function: {
          mockResource1: {},
        },
        storage: {
          mockResource1: {},
        },
        auth: {
          mockResource1: {
            service: 'Cognito',
          },
        },
      })
      .mockReturnValueOnce({
        auth: {
          mockResource1: {
            service: 'Cognito',
          },
          mockResource2: {
            service: 'Cognito-UserPool-Groups',
          },
        },
      })
      .mockReturnValueOnce({
        analytics: {
          mockResource1: {},
        },
        api: {
          mockResource1: {},
        },
        function: {
          mockResource1: {},
        },
        storage: {
          mockResource1: {},
        },
        auth: {
          mockResource1: {
            service: 'Cognito',
          },
        },
      }),
  },
}));

const removeResource_mock = jest
  .fn()
  .mockResolvedValue({
    service: 'Cognito',
  })
  .mockResolvedValueOnce({
    service: 'Cognito',
  })
  .mockResolvedValueOnce({
    service: 'Cognito-UserPool-Groups',
  });

const warningString = messages.dependenciesExists;
const mockContext = {
  amplify: {
    removeResource: removeResource_mock,
  },
  parameters: {
    first: 'mockFirst',
  },
};
const context_stub_typed = mockContext as unknown as $TSContext;

test(`remove method should detect existing categories metadata and display warning with no userPoolGroup`, async () => {
  await remove.run(context_stub_typed);
  expect(printer.info).toBeCalledWith(warningString);
  expect(context_stub_typed.amplify.removeResource).toBeCalled();
});

test(`remove method should  not  display warning when there is no dependency with no userPoolGroup`, async () => {
  jest.clearAllMocks();
  await remove.run(context_stub_typed);
  expect(printer.info).not.toBeCalledWith(warningString);
  expect(context_stub_typed.amplify.removeResource).toBeCalled();
});

test(`remove method should still be called even when warning displayed for existing category resource and remmoves userPool group`, async () => {
  await remove.run(context_stub_typed);
  expect(saveCLIInputPayload_mock).toBeCalledWith({ cognitoConfig: { userPoolGroupList: [] } });
});
