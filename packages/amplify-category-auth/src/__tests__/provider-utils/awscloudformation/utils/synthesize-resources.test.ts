import { $TSAny, $TSContext, AmplifyCategories, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import { UserPoolGroupMetadata } from '../../../../provider-utils/awscloudformation/auth-stack-builder';
import { updateUserPoolGroups } from '../../../../provider-utils/awscloudformation/utils/synthesize-resources';
import { createAdminAuthFunction } from '../../../../provider-utils/awscloudformation/utils/synthesize-resources';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('fs-extra');
jest.mock('../../../../provider-utils/awscloudformation/utils/generate-user-pool-group-stack-template');

describe('correctly updates userPool group list', () => {
  let mockContext: $TSAny;
  const resourceName = 'mockResource';
  const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
  const JSONUtilitiesMock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
  beforeEach(() => {
    mockContext = {
      amplify: {
        updateamplifyMetaAfterResourceUpdate: jest.fn(),
        pathManager,
      },
    };
    pathManagerMock.getBackendDirPath = jest.fn().mockReturnValue('backend');
  });
  afterEach(() => jest.resetAllMocks());

  const expectAmplifyMetaFileUpdate = (): void => {
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(3);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
      AmplifyCategories.AUTH,
      'userPoolGroups',
      'service',
      'Cognito-UserPool-Groups',
    );
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
      AmplifyCategories.AUTH,
      'userPoolGroups',
      'providerPlugin',
      'awscloudformation',
    );
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(AmplifyCategories.AUTH, 'userPoolGroups', 'dependsOn', [
      {
        category: AmplifyCategories.AUTH,
        resourceName,
        attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID'],
      },
    ]);
  };

  it('correctly updates userPool precedence file when no updated userPool groups in empty', async () => {
    const updatedUserPoolList: string[] = [];
    JSONUtilitiesMock.readJson = jest.fn().mockReturnValue([]);
    await updateUserPoolGroups(mockContext as unknown as $TSContext, resourceName, updatedUserPoolList);
    expect(JSONUtilitiesMock.writeJson).not.toBeCalled();
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).not.toBeCalled();
  });

  it('correctly updates userPool precedence file when no prev userPool group is added', async () => {
    const updatedUserPoolList = ['admin', 'developers', 'ops'];
    JSONUtilitiesMock.readJson = jest.fn().mockReturnValue([]);
    await updateUserPoolGroups(mockContext as unknown as $TSContext, resourceName, updatedUserPoolList);
    expect(JSONUtilitiesMock.writeJson.mock.calls[0]).toMatchInlineSnapshot(`
[
  "backend/auth/userPoolGroups/user-pool-group-precedence.json",
  [
    {
      "groupName": "admin",
      "precedence": 1,
    },
    {
      "groupName": "developers",
      "precedence": 2,
    },
    {
      "groupName": "ops",
      "precedence": 3,
    },
  ],
]
`);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(3);
    expectAmplifyMetaFileUpdate();
  });

  it('correctly updates userPool precedence file when prev userPool group has precedence mismatch', async () => {
    const updatedUserPoolList = ['admin', 'users', 'ops'];
    const prevUserPoolGroupList: UserPoolGroupMetadata[] = [
      {
        groupName: 'admin',
        precedence: 2,
      },
      {
        groupName: 'users',
        precedence: 1,
      },
    ];
    JSONUtilitiesMock.readJson = jest.fn().mockReturnValue(prevUserPoolGroupList);
    await updateUserPoolGroups(mockContext as unknown as $TSContext, resourceName, updatedUserPoolList);
    expect(JSONUtilitiesMock.writeJson.mock.calls[0]).toMatchInlineSnapshot(`
[
  "backend/auth/userPoolGroups/user-pool-group-precedence.json",
  [
    {
      "groupName": "admin",
      "precedence": 1,
    },
    {
      "groupName": "users",
      "precedence": 2,
    },
    {
      "groupName": "ops",
      "precedence": 3,
    },
  ],
]
`);
    expectAmplifyMetaFileUpdate();
  });

  it('correctly updates userPool precedence file when userPool group contains custom policies', async () => {
    const updatedUserPoolList = ['admin', 'users', 'ops'];
    const prevUserPoolGroupList: UserPoolGroupMetadata[] = [
      {
        groupName: 'users',
        precedence: 1,
        customPolicies: 'mockPolicies',
      },
      {
        groupName: 'ops',
        precedence: 2,
      },
    ];
    JSONUtilitiesMock.readJson = jest.fn().mockReturnValue(prevUserPoolGroupList);
    await updateUserPoolGroups(mockContext as unknown as $TSContext, resourceName, updatedUserPoolList);
    expect(JSONUtilitiesMock.writeJson.mock.calls[0]).toMatchInlineSnapshot(`
[
  "backend/auth/userPoolGroups/user-pool-group-precedence.json",
  [
    {
      "groupName": "admin",
      "precedence": 1,
    },
    {
      "customPolicies": "mockPolicies",
      "groupName": "users",
      "precedence": 2,
    },
    {
      "groupName": "ops",
      "precedence": 3,
    },
  ],
]
`);
    expectAmplifyMetaFileUpdate();
  });
});

describe('correctly handles local overwrites', () => {
  let mockContext: $TSAny;
  const resourceName = 'mockResource';
  const functionName = 'mockFunctionName';
  const adminGroup = 'mockAdminGroup';
  const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
  beforeEach(() => {
    mockContext = {
      amplify: {
        copyBatch: jest.fn().mockReturnValue({}),
        pathManager,
        updateamplifyMetaAfterResourceAdd: jest.fn(),
      },
    };
    pathManagerMock.getBackendDirPath = jest.fn().mockReturnValue('backend');
  });
  afterEach(() => jest.resetAllMocks());

  it('ensure local backend chanes are not overwritten on amplify update auth', async () => {
    const operation = 'update';
    await createAdminAuthFunction(mockContext as unknown as $TSContext, resourceName, functionName, adminGroup, operation);
    expect(mockContext.amplify.copyBatch).not.toBeCalled();
  });

  it('ensure local backend chanes are not overwritten on amplify update auth', async () => {
    const operation = 'add';
    await createAdminAuthFunction(mockContext as unknown as $TSContext, resourceName, functionName, adminGroup, operation);
    expect(mockContext.amplify.copyBatch).toBeCalled();
  });
});
