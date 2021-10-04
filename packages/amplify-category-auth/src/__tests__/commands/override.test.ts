import { run } from '../../commands/auth/override';
import { migrateResourceToSupportOverride } from '../../provider-utils/awscloudformation/utils/migrate-override-resource';
import { generateAuthStackTemplate } from '../../provider-utils/awscloudformation/utils/generate-auth-stack-template';
import { $TSContext, generateOverrideSkeleton } from 'amplify-cli-core';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';

jest.mock('amplify-prompts', () => ({
  printer: {
    warn: jest.fn(),
  },
  prompter: {
    confirmContinue: jest.fn().mockReturnValue(true),
  },
}));
jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  stateManager: {
    getMeta: jest.fn().mockReturnValue({
      auth: {
        mockResource1: {},
      },
    }),
  },
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockDirPath'),
  },
  generateOverrideSkeleton: jest.fn(),
}));

jest.mock('../../provider-utils/awscloudformation/utils/migrate-override-resource');

jest.mock('../../provider-utils/awscloudformation/utils/generate-auth-stack-template');

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state', () => {
  return {
    AuthInputState: jest.fn().mockImplementation(() => {
      return {
        isCLIInputsValid: jest.fn(),
        getCLIInputPayload: jest
          .fn()
          .mockImplementationOnce(() => {})
          .mockImplementationOnce(() => {
            throw new Error();
          }),
      };
    }),
  };
});

test('migration doesnt get called when cli-inputs exist', async () => {
  const mockContext = {} as unknown as $TSContext;

  run(mockContext);
  expect(migrateResourceToSupportOverride).not.toBeCalled();
  expect(generateAuthStackTemplate).not.toBeCalled();
  expect(generateOverrideSkeleton).toBeCalled();
});
