import { run } from '../../commands/auth/override';
import { migrateResourceToSupportOverride } from '../../provider-utils/awscloudformation/utils/migrate-override-resource';
import { generateAuthStackTemplate } from '../../provider-utils/awscloudformation/utils/generate-auth-stack-template';
import { $TSContext, generateOverrideSkeleton } from 'amplify-cli-core';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');

jest.mock('amplify-prompts', () => ({
  printer: {
    warn: jest.fn(),
    debug: jest.fn(),
  },
  prompter: {
    confirmContinue: jest.fn().mockReturnValue(true),
    pick: jest.fn().mockReturnValue('mockResource'),
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

jest.mock('../../provider-utils/awscloudformation/utils/migrate-override-resource', () => ({
  migrateResourceToSupportOverride: jest.fn(),
}));

jest.mock('../../provider-utils/awscloudformation/utils/generate-auth-stack-template', () => ({
  generateAuthStackTemplate: jest.fn(),
}));

test('migration gets called when cli-inputs doesnt exist', async () => {
  jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => false);

  await run({} as unknown as $TSContext);
  expect(migrateResourceToSupportOverride).toBeCalled();
  expect(generateAuthStackTemplate).toBeCalled();
  expect(generateOverrideSkeleton).toBeCalled();
});

test('migration doesnt called when cli-inputs exist', async () => {
  jest.clearAllMocks();
  jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
  await run({} as unknown as $TSContext);
  expect(migrateResourceToSupportOverride).not.toBeCalled();
  expect(generateAuthStackTemplate).not.toBeCalled();
  expect(generateOverrideSkeleton).toBeCalled();
});
