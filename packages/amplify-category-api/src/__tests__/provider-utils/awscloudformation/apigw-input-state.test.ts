import { $TSContext, getMigrateResourceMessageForOverride, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';
import { ApigwInputState } from '../../../provider-utils/awscloudformation/apigw-input-state';

jest.mock('amplify-cli-core');
jest.mock('fs-extra');
jest.mock('path');
jest.mock('../../../provider-utils/awscloudformation/cdk-stack-builder');

const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const prompter_mock = prompter as jest.Mocked<typeof prompter>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

const context_mock = {
  amplify: {
    updateamplifyMetaAfterResourceAdd: jest.fn(),
    updateamplifyMetaAfterResourceUpdate: jest.fn(),
  },
  filesystem: {
    remove: jest.fn(),
  },
} as unknown as $TSContext;

pathManager_mock.findProjectRoot = jest.fn().mockReturnValue('mockProjRoot');

describe('REST API input state', () => {
  afterEach(() => jest.clearAllMocks());

  it('generates expected artifacts when adding a REST API', async () => {
    const mockApiPaths = {
      '/mock': {
        permissions: {
          setting: 'open',
        },
        lambdaFunction: 'mockLambda',
      },
    };

    const inputState = new ApigwInputState(context_mock);
    await expect(
      inputState.addApigwResource((async () => ({ answers: { paths: mockApiPaths, resourceName: 'mockApi' } } as any))(), {}),
    ).resolves.toEqual('mockApi');

    expect(stateManager_mock.setResourceInputsJson).toHaveBeenCalledWith('mockProjRoot', 'api', 'mockApi', {
      version: 1,
      paths: mockApiPaths,
    });
    expect(stateManager_mock.setResourceParametersJson).toHaveBeenCalled();
    expect(context_mock.amplify.updateamplifyMetaAfterResourceAdd).toHaveBeenCalled();
  });

  it('generates expected artifacts when updating a REST API', async () => {
    const mockApiPaths = {
      '/mock': {
        permissions: {
          setting: 'private',
          auth: ['create', 'read'],
        },
        lambdaFunction: 'mockLambda',
      },
    };

    const inputState = new ApigwInputState(context_mock);
    await expect(
      inputState.updateApigwResource((async () => ({ answers: { paths: mockApiPaths, resourceName: 'mockApi' } } as any))()),
    ).resolves.toEqual('mockApi');

    expect(stateManager_mock.setResourceInputsJson).toHaveBeenCalledWith('mockProjRoot', 'api', 'mockApi', {
      version: 1,
      paths: mockApiPaths,
    });
    expect(stateManager_mock.setResourceParametersJson).toHaveBeenCalled();
    expect(context_mock.amplify.updateamplifyMetaAfterResourceUpdate).toHaveBeenCalled();
  });

  it('generates expected artifacts when choosing to migrate a REST API', async () => {
    const mockDeprecatedParams = {
      paths: [
        {
          name: '/mock',
          lambdaFunction: 'mockLambda',
          privacy: {
            private: true,
            auth: ['/GET'],
          },
          policyResourceName: '/mock',
        },
      ],
      resourceName: 'mockApi',
      apiName: 'mockApi',
      functionArns: [
        {
          lambdaFunction: 'mockLambda',
        },
      ],
      privacy: {
        auth: 1,
        unauth: 0,
        authRoleName: 'mockauthRole',
        unAuthRoleName: 'mockunauthRole',
      },
      dependsOn: [
        {
          category: 'function',
          resourceName: 'mockLambda',
          attributes: ['Name', 'Arn'],
        },
      ],
    };

    const mockApiPaths = {
      '/mock': {
        permissions: {
          setting: 'private',
          auth: ['read'],
        },
        lambdaFunction: 'mockLambda',
      },
    };

    prompter_mock.yesOrNo = jest.fn().mockResolvedValueOnce(true); // yes to migration
    JSONUtilities_mock.readJson = jest.fn().mockReturnValueOnce(mockDeprecatedParams);

    const inputState = new ApigwInputState(context_mock);
    await inputState.migrateApigwResource('mockApi');

    expect(getMigrateResourceMessageForOverride).toHaveBeenCalled();
    expect(stateManager_mock.setResourceInputsJson).toHaveBeenCalledWith('mockProjRoot', 'api', 'mockApi', {
      version: 1,
      paths: mockApiPaths,
    });
    expect(stateManager_mock.setResourceParametersJson).toHaveBeenCalled();
    expect(context_mock.filesystem.remove).toHaveBeenCalledTimes(3);
  });

  it('does nothing when choosing NOT to migrate a REST API', async () => {
    const inputState = new ApigwInputState(context_mock);

    prompter_mock.yesOrNo = jest.fn().mockResolvedValueOnce(false); // no to migration

    await inputState.migrateApigwResource('mockApi');

    expect(getMigrateResourceMessageForOverride).toHaveBeenCalled();
    expect(stateManager_mock.setResourceInputsJson).not.toHaveBeenCalled();
    expect(stateManager_mock.setResourceParametersJson).not.toHaveBeenCalled();
    expect(context_mock.amplify.updateamplifyMetaAfterResourceUpdate).not.toHaveBeenCalled();
    expect(context_mock.filesystem.remove).not.toHaveBeenCalled();
  });

  it('generates expected artifacts when choosing to migrate an Admin Queries API', async () => {
    prompter_mock.yesOrNo = jest.fn().mockResolvedValueOnce(true); // yes to migration

    const inputState = new ApigwInputState(context_mock);
    await inputState.migrateAdminQueries({
      apiName: 'AdminQueries',
      authResourceName: 'mockCognito',
      functionName: 'mockLambda',
      dependsOn: [],
    });

    expect(getMigrateResourceMessageForOverride).toHaveBeenCalled();
    expect(stateManager_mock.setResourceInputsJson).toHaveBeenCalled();
    expect(stateManager_mock.setResourceParametersJson).toHaveBeenCalled();
    expect(context_mock.filesystem.remove).toHaveBeenCalledTimes(2);
  });

  it('does nothing when choosing NOT to migrate an Admin Queries API', async () => {
    const inputState = new ApigwInputState(context_mock);

    prompter_mock.yesOrNo = jest.fn().mockResolvedValueOnce(false); // no to migration

    await inputState.migrateAdminQueries({
      apiName: 'AdminQueries',
      authResourceName: 'mockCognito',
      functionName: 'mockLambda',
      dependsOn: [],
    });

    expect(getMigrateResourceMessageForOverride).toHaveBeenCalled();
    expect(stateManager_mock.setResourceInputsJson).not.toHaveBeenCalled();
    expect(stateManager_mock.setResourceParametersJson).not.toHaveBeenCalled();
    expect(context_mock.amplify.updateamplifyMetaAfterResourceUpdate).not.toHaveBeenCalled();
    expect(context_mock.filesystem.remove).not.toHaveBeenCalled();
  });

  it('generates expected artifacts when adding an Admin Queries API', async () => {
    const inputState = new ApigwInputState(context_mock);
    const mockApiPaths = {
      '/{proxy+}': {
        permissions: {
          setting: 'private',
          auth: ['create', 'read', 'update', 'delete'],
        },
        lambdaFunction: 'mockLambda',
      },
    };

    await inputState.addAdminQueriesResource({
      apiName: 'AdminQueries',
      authResourceName: 'mockCognito',
      functionName: 'mockLambda',
      dependsOn: [],
    });

    expect(stateManager_mock.setResourceInputsJson).toHaveBeenCalledWith('mockProjRoot', 'api', 'AdminQueries', {
      version: 1,
      paths: mockApiPaths,
    });
    expect(stateManager_mock.setResourceParametersJson).toHaveBeenCalled();
    expect(context_mock.amplify.updateamplifyMetaAfterResourceAdd).toHaveBeenCalled();
  });

  it('generates expected artifacts when updating an Admin Queries API', async () => {
    const inputState = new ApigwInputState(context_mock);
    const mockApiPaths = {
      '/{proxy+}': {
        permissions: {
          setting: 'private',
          auth: ['create', 'read', 'update', 'delete'],
        },
        lambdaFunction: 'mockLambda',
      },
    };

    await inputState.updateAdminQueriesResource({
      apiName: 'AdminQueries',
      authResourceName: 'mockCognito',
      functionName: 'mockLambda',
      dependsOn: [],
    });

    expect(stateManager_mock.setResourceInputsJson).toHaveBeenCalledWith('mockProjRoot', 'api', 'AdminQueries', {
      version: 1,
      paths: mockApiPaths,
    });
    expect(stateManager_mock.setResourceParametersJson).toHaveBeenCalled();
    expect(context_mock.amplify.updateamplifyMetaAfterResourceUpdate).toHaveBeenCalled();
  });
});
