import {
  $TSAny, $TSContext, JSONUtilities, pathManager,
} from 'amplify-cli-core';
import { UserPoolGroupMetadata } from '../../../../provider-utils/awscloudformation/auth-stack-builder';
import { updateUserPoolGroups } from '../../../../provider-utils/awscloudformation/utils/synthesize-resources';

jest.mock('amplify-cli-core');
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
      },
    };
    pathManagerMock.getBackendDirPath = jest.fn().mockReturnValue('backend');
  });
  afterEach(() => jest.resetAllMocks());

  it('correctly updates userPool precedence file when no updated userPool groups in empty', async () => {
    const updatedUserPoolList: string[] = [];
    JSONUtilitiesMock.readJson = jest.fn().mockReturnValue([]);
    await updateUserPoolGroups((mockContext as unknown) as $TSContext, resourceName, updatedUserPoolList);
    expect(JSONUtilitiesMock.writeJson).not.toBeCalled();
  });

  it('correctly updates userPool precedence file when no prev userPool group is added', async () => {
    const updatedUserPoolList = ['admin', 'developers', 'ops'];
    JSONUtilitiesMock.readJson = jest.fn().mockReturnValue([]);
    await updateUserPoolGroups((mockContext as unknown) as $TSContext, resourceName, updatedUserPoolList);
    expect(JSONUtilitiesMock.writeJson.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "backend/auth/userPoolGroups/user-pool-group-precedence.json",
        Array [
          Object {
            "groupName": "admin",
            "precedence": 1,
          },
          Object {
            "groupName": "developers",
            "precedence": 2,
          },
          Object {
            "groupName": "ops",
            "precedence": 3,
          },
        ],
      ]
    `);
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
    await updateUserPoolGroups((mockContext as unknown) as $TSContext, resourceName, updatedUserPoolList);
    expect(JSONUtilitiesMock.writeJson.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "backend/auth/userPoolGroups/user-pool-group-precedence.json",
        Array [
          Object {
            "groupName": "admin",
            "precedence": 1,
          },
          Object {
            "groupName": "users",
            "precedence": 2,
          },
          Object {
            "groupName": "ops",
            "precedence": 3,
          },
        ],
      ]
    `);
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
    await updateUserPoolGroups((mockContext as unknown) as $TSContext, resourceName, updatedUserPoolList);
    expect(JSONUtilitiesMock.writeJson.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        "backend/auth/userPoolGroups/user-pool-group-precedence.json",
        Array [
          Object {
            "groupName": "admin",
            "precedence": 1,
          },
          Object {
            "customPolicies": "mockPolicies",
            "groupName": "users",
            "precedence": 2,
          },
          Object {
            "groupName": "ops",
            "precedence": 3,
          },
        ],
      ]
    `);
  });
});
