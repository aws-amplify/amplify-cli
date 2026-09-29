import { stateManager, $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as remove from '../../commands/auth/remove';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';

jest.mock('@aws-amplify/amplify-prompts');

const saveCLIInputPayloadMock = jest.fn();

jest.mock('fs-extra');

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state', () => ({
  AuthInputState: jest.fn().mockImplementation(() => ({
    isCLIInputsValid: jest.fn(),
    getCLIInputPayload: jest.fn().mockImplementation(() => ({
      cognitoConfig: {
        userPoolGroupList: ['admin'],
      },
    })),
    saveCLIInputPayload: saveCLIInputPayloadMock,
  })),
}));

jest.mock('@aws-amplify/amplify-cli-core');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
stateManagerMock.getMeta.mockReturnValue({
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
});

const AmplifyErrorMock = AmplifyError as jest.MockedClass<typeof AmplifyError>;
AmplifyErrorMock.mockImplementation(() => new Error('test error') as unknown as any);

const removeResourceMock = jest.fn().mockResolvedValue({
  service: 'Cognito',
});

const warningString = messages.dependenciesExists;
const mockContext = {
  amplify: {
    removeResource: removeResourceMock,
  },
  parameters: {
    first: 'mockFirst',
  },
};
const ContextStubTyped = mockContext as unknown as $TSContext;

beforeEach(() => jest.clearAllMocks());

test(`remove method should detect existing categories metadata and display warning with no userPoolGroup`, async () => {
  await remove.run(ContextStubTyped);
  expect(printer.warn).toBeCalledWith(warningString);
  expect(ContextStubTyped.amplify.removeResource).toBeCalled();
});

test(`remove method should  not  display warning when there is no dependency with no userPoolGroup`, async () => {
  stateManagerMock.getMeta.mockReturnValueOnce({
    auth: {
      mockResource1: {
        service: 'Cognito',
      },
      mockResource2: {
        service: 'Cognito-UserPool-Groups',
      },
    },
  });
  await remove.run(ContextStubTyped);
  expect(printer.warn).not.toBeCalledWith(warningString);
  expect(ContextStubTyped.amplify.removeResource).toBeCalled();
});

test(`remove called when warning displayed for existing category resource and removes userPool group`, async () => {
  removeResourceMock.mockResolvedValueOnce({
    service: 'Cognito-UserPool-Groups',
  });
  await remove.run(ContextStubTyped);
  expect(saveCLIInputPayloadMock).toBeCalledWith({ cognitoConfig: { userPoolGroupList: [] } });
});

test('remove throws error if project has analytics', async () => {
  stateManagerMock.getMeta.mockReturnValueOnce({
    analytics: {
      mockAnalytics1: {},
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
  });
  await expect(() => remove.run(ContextStubTyped)).rejects.toThrowErrorMatchingInlineSnapshot(`"test error"`);
});
