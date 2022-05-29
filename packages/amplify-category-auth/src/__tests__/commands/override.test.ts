import { run } from '../../commands/auth/override';
import { $TSContext, generateOverrideSkeleton } from 'amplify-cli-core';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { checkAuthResourceMigration } from '../../provider-utils/awscloudformation/utils/check-for-auth-migration';

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');

jest.mock('fs-extra');

jest.mock('amplify-prompts', () => ({
  printer: {
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
  prompter: {
    confirmContinue: jest.fn().mockReturnValue(true),
    pick: jest.fn().mockReturnValue('mockResource'),
  },
}));

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  stateManager: {
    getMeta: jest
      .fn()
      .mockReturnValueOnce({
        auth: {
          mockResource1: {},
        },
      })
      .mockReturnValueOnce({
        auth: {},
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

jest.mock('../../provider-utils/awscloudformation/utils/check-for-auth-migration', () => ({
  checkAuthResourceMigration: jest.fn(),
}));

test('check migration gets called when there is a resource', async () => {
  await run({} as unknown as $TSContext);
  expect(checkAuthResourceMigration).toBeCalled();
  expect(generateOverrideSkeleton).toBeCalled();
});

test('check migration doesnt gets called when there is no resource', async () => {
  jest.clearAllMocks();
  await run({} as unknown as $TSContext);
  expect(checkAuthResourceMigration).not.toBeCalled();
  expect(generateOverrideSkeleton).not.toBeCalled();
});
