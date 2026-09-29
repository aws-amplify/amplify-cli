import { migrateResourceToSupportOverride } from '../../../../provider-utils/awscloudformation/utils/migrate-override-resource';
import { generateAuthStackTemplate } from '../../../../provider-utils/awscloudformation/utils/generate-auth-stack-template';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AuthInputState } from '../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { checkAuthResourceMigration } from '../../../../provider-utils/awscloudformation/utils/check-for-auth-migration';

jest.mock('../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');

jest.mock('fs-extra');

jest.mock('@aws-amplify/amplify-prompts', () => ({
  printer: {
    warn: jest.fn(),
    debug: jest.fn(),
  },
  prompter: {
    yesOrNo: jest.fn().mockReturnValue(true),
    pick: jest.fn().mockReturnValue('mockResource'),
  },
}));

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
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

jest.mock('../../../../provider-utils/awscloudformation/utils/migrate-override-resource', () => ({
  migrateResourceToSupportOverride: jest.fn(),
}));

jest.mock('../../../../provider-utils/awscloudformation/utils/generate-auth-stack-template', () => ({
  generateAuthStackTemplate: jest.fn(),
}));

test('migration gets called when cli-inputs doesnt exist', async () => {
  jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => false);
  jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
    version: '1',
    cognitoConfig: {
      authSelections: 'identityPoolAndUserPool',
      autoVerifiedAttributes: ['mock'],
      mfaConfiguration: 'OFF',
      requiredAttributes: ['mock'],
      resourceName: 'mockResource',
      useDefault: 'default',
      userpoolClientGenerateSecret: true,
      userpoolClientLambdaRole: 'lambda',
      userpoolClientReadAttributes: ['mockAttributes'],
      userpoolClientWriteAttributes: ['mockAttributes'],
      AllowedOAuthFlows: 'code',
      AllowedOAuthScopes: ['mockScope'],
      serviceName: 'Cognito',
    },
  });

  const mockContext = {
    amplify: {
      getImportedAuthProperties: jest.fn().mockReturnValue({ imported: false }),
    },
    input: {
      options: {},
    },
  };

  await checkAuthResourceMigration(mockContext as unknown as $TSContext, 'mockResource', true);
  expect(migrateResourceToSupportOverride).toBeCalled();
  expect(generateAuthStackTemplate).toBeCalled();
});

test('migration doesnt called when cli-inputs exist', async () => {
  jest.clearAllMocks();
  jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
  jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload');
  const mockContext = {
    amplify: {
      getImportedAuthProperties: jest.fn().mockReturnValue({ imported: false }),
    },
  };

  await checkAuthResourceMigration(mockContext as unknown as $TSContext, 'mockResource', true);
  expect(migrateResourceToSupportOverride).not.toBeCalled();
  expect(generateAuthStackTemplate).not.toBeCalled();
});
