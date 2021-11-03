import { JSONUtilities } from 'amplify-cli-core';
import { migrateResourceToSupportOverride } from '../../../../provider-utils/awscloudformation/utils/migrate-api-override-resource';
import * as path from 'path';

jest.mock('amplify-prompts');
jest.mock('fs-extra');

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  pathManager: {
    findProjectRoot: jest.fn().mockReturnValue('somePath'),
    getBackendDirPath: jest.fn().mockReturnValue('mockProjectPath'),
    getResourceDirectoryPath: jest.fn().mockReturnValue('mockProjectPath'),
  },
  stateManager: {
    getMeta: jest.fn().mockReturnValue({
      api: {
        apiunittests: {
          service: 'AppSync',
          providerPlugin: 'awscloudformation',
          output: {
            authConfig: {
              defaultAuthentication: {
                authenticationType: 'AMAZON_COGNITO_USER_POOLS',
                userPoolConfig: {
                  userPoolId: 'authapiunittests2778e848',
                },
              },
              additionalAuthenticationProviders: [
                {
                  authenticationType: 'AWS_IAM',
                },
              ],
            },
          },
        },
      },
    }),
  },
  JSONUtilities: {
    readJson: jest.fn().mockReturnValue({
      ResolverConfig: {
        project: {
          ConflictHandler: 'AUTOMERGE',
          ConflictDetection: 'VERSION',
        },
      },
    }),
    writeJson: jest.fn(),
  },
}));
test('migrate resource', async () => {
  const resourceName = 'apiunittests';
  migrateResourceToSupportOverride(resourceName);
  const expectedPath = path.join('mockProjectPath', 'cli-inputs.json');
  const expectedPayload = {
    version: 1,
    serviceConfiguration: {
      serviceName: 'AppSync',
      defaultAuthType: {
        mode: 'AMAZON_COGNITO_USER_POOLS',
        cognitoUserPoolId: 'authapiunittests2778e848',
      },
      additionalAuthTypes: [
        {
          mode: 'AWS_IAM',
        },
      ],
      conflictResolution: {},
      apiName: 'apiunittests',
      gqlSchemaPath: 'mockProjectPath/schema.graphql',
    },
  };
  expect(JSONUtilities.writeJson).toBeCalledWith(expectedPath, expectedPayload);
});
