import { CognitoIdentityProviderClient, DescribeUserPoolCommand, ListGroupsCommand } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient, GetIdentityPoolRolesCommand, ListIdentityPoolsCommand } from '@aws-sdk/client-cognito-identity';
import { CloudFormationClient, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';
import { AmplifyClient, ListBackendEnvironmentsCommand } from '@aws-sdk/client-amplify';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { AmplifyStackParser } from './amplify_stack_parser';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { AppAuthDefinitionFetcher } from './app_auth_definition_fetcher';
import { BackendDownloader } from './backend_downloader';

const mockUserPoolName = 'mockUserPoolName';
const mockUserPoolID = 'UserPoolId';
const mockIdentityPoolName = 'mockIdentityPoolName';
const mockIdentityPoolId = 'IdentityPoolId';
const mockAppClientId = 'AppClientID';
const mockAppClientIdWeb = 'AppClientIDWeb';
const mockAuthenticatedRoleARN = 'authenticated';
const mockUnauthenticatedRoleARN = 'unauthenticated';
const mockCognitoIdentityProviderClientSendFn = jest.fn();

const mockImportedAuthMeta = JSON.stringify({
  auth: {
    importedAuth: {
      service: 'Cognito',
      serviceType: 'imported',
      output: {
        UserPoolId: mockUserPoolID,
        UserPoolName: mockUserPoolName,
        AppClientID: mockAppClientId,
        AppClientIDWeb: mockAppClientIdWeb,
        IdentityPoolId: mockIdentityPoolId,
        IdentityPoolName: mockIdentityPoolName,
      },
    },
  },
});

const mockReadFile = jest.fn().mockResolvedValue(mockImportedAuthMeta);

jest.mock('unzipper', () => ({
  Open: {
    file: jest.fn().mockResolvedValue({
      extract: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('node:fs/promises', () => {
  return {
    mkdtemp: jest.fn().mockResolvedValue('tmp'),
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(true),
    readFile: () => mockReadFile(),
  };
});
jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-cognito-identity-provider'),
    CognitoIdentityProviderClient: function () {
      return {
        send: mockCognitoIdentityProviderClientSendFn.mockImplementation((command) => {
          if (command instanceof DescribeUserPoolCommand) {
            return Promise.resolve({
              UserPoolClient: {
                ClientId: 'ClientId',
                UserPoolId: 'UserPoolId',
                ClientName: 'ClientName',
              },
            });
          } else if (command instanceof ListGroupsCommand) {
            return Promise.resolve({
              Groups: [
                {
                  GroupName: 'Admin',
                  RoleArn: 'RoleArn',
                  Description: 'Description',
                  Precedence: 1,
                  LastModifiedDate: 'LastModifiedDate',
                  CreationDate: 'CreationDate',
                },
              ],
            });
          }
          return undefined;
        }),
      };
    },
  };
});

jest.mock('@aws-sdk/client-cognito-identity', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-cognito-identity'),
    CognitoIdentityClient: function () {
      return {
        send: jest.fn().mockImplementation((command) => {
          if (command instanceof ListIdentityPoolsCommand) {
            return Promise.resolve({
              IdentityPools: [
                {
                  IdentityPoolId: 'IdentityPoolId',
                  IdentityPoolName: 'IdentityPoolName',
                },
              ],
            });
          } else if (command instanceof GetIdentityPoolRolesCommand) {
            return Promise.resolve({
              Roles: {
                authenticated: mockAuthenticatedRoleARN,
                unauthenticated: mockUnauthenticatedRoleARN,
              },
            });
          }
          return Promise.resolve();
        }),
      };
    },
  };
});

jest.mock('@aws-sdk/client-amplify', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-amplify'),
    AmplifyClient: function () {
      return {
        send: jest.fn().mockImplementation((command) => {
          if (command instanceof ListBackendEnvironmentsCommand) {
            return Promise.resolve({
              backendEnvironments: [
                {
                  environmentName: 'dev',
                  deploymentArtifacts: 's3://deploymentArtifacts',
                  stackName: 'stackName',
                },
              ],
            });
          }
          return Promise.resolve();
        }),
      };
    },
  };
});

jest.mock('@aws-sdk/client-s3', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-s3'),
    S3Client: function () {
      return {
        send: jest.fn().mockImplementation((command) => {
          if (command instanceof GetObjectCommand) {
            return Promise.resolve({
              Body: mockImportedAuthMeta,
            });
          }
          return Promise.resolve();
        }),
      };
    },
  };
});

jest.mock('@aws-sdk/client-cloudformation', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-cloudformation'),
    CloudFormationClient: function () {
      return {
        send: jest.fn().mockImplementation((command) => {
          if (command instanceof DescribeStackResourcesCommand) {
            return Promise.resolve({
              StackResources: [],
            });
          }
          return Promise.resolve();
        }),
      };
    },
  };
});

const cognitoIdentityProviderClient = new CognitoIdentityProviderClient();
const cognitoIdentityClient = new CognitoIdentityClient();
const cloudFormationClient = new CloudFormationClient();
const amplifyStackParser = new AmplifyStackParser(cloudFormationClient);
const amplifyClient = new AmplifyClient();
const s3Client = new S3Client();
const appId = 'appId';
const backendEnvironmentResolver = new BackendEnvironmentResolver(appId, amplifyClient);
const ccbFetcher = new BackendDownloader(s3Client);

describe('Auth definition Fetcher tests', () => {
  const appAuthDefinitionFetcher = new AppAuthDefinitionFetcher(
    cognitoIdentityClient,
    cognitoIdentityProviderClient,
    amplifyStackParser,
    backendEnvironmentResolver,
    () => Promise.resolve({}),
    ccbFetcher,
  );
  it('should not fetch imported auth definitions when not present', async () => {
    // arrange
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        api: {},
      }),
    );
    // act + assert
    await expect(appAuthDefinitionFetcher.getDefinition()).resolves.toEqual(undefined);
  });
  it('should fetch imported auth definitions', async () => {
    await expect(appAuthDefinitionFetcher.getDefinition()).resolves.toEqual({
      referenceAuth: {
        groups: {
          Admin: 'RoleArn',
        },
        identityPoolId: mockIdentityPoolId,
        authRoleArn: mockAuthenticatedRoleARN,
        unauthRoleArn: mockUnauthenticatedRoleARN,
        userPoolClientId: mockAppClientIdWeb,
        userPoolId: mockUserPoolID,
      },
    });
  });

  it('should not fetch imported auth definitions if there is no related cognito resource information', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        auth: {
          importedAuth: {
            service: 'Cognito',
            serviceType: 'imported',
            output: {},
          },
        },
      }),
    );
    await expect(appAuthDefinitionFetcher.getDefinition()).rejects.toEqual(new Error('No user pool or identity pool found for import.'));
  });
});
