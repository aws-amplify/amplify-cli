import { $TSContext, stateManager, pathManager } from 'amplify-cli-core';
import { mocked } from 'ts-jest/utils';
import { FunctionSecretsStateManager } from '../../../../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { getAppId } from '../../../../provider-utils/awscloudformation/secrets/secretName';
import * as path from 'path';
import { SSMClientWrapper } from '../../../../provider-utils/awscloudformation/secrets/ssmClientWrapper';

jest.mock('amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/secrets/ssmClientWrapper');
jest.mock('../../../../provider-utils/awscloudformation/secrets/secretsCfnModifier');
jest.mock('../../../../provider-utils/awscloudformation/secrets/secretName');
jest.mock('../../../../provider-utils/awscloudformation/utils/updateTopLevelComment');
jest.mock('../../../../provider-utils/awscloudformation/utils/cloudformationHelpers');

const stateManager_mock = mocked(stateManager);
const pathManager_mock = mocked(pathManager);
const getAppId_mock = mocked(getAppId);
const SSMClientWrapper_mock = mocked(SSMClientWrapper);

stateManager_mock.getLocalEnvInfo.mockReturnValue({
  envName: 'testtest',
});
stateManager_mock.getTeamProviderInfo.mockReturnValue({});

pathManager_mock.getBackendDirPath.mockReturnValue(path.join('test', 'path'));

getAppId_mock.mockReturnValue('testappid');

SSMClientWrapper_mock.getInstance.mockResolvedValue(({
  deleteSecret: jest.fn(),
  setSecret: jest.fn(),
} as unknown) as SSMClientWrapper);

describe('syncSecretDeltas', () => {
  const context_stub = ({
    parameters: {
      command: 'update',
    },
  } as unknown) as $TSContext;
  beforeEach(jest.clearAllMocks);

  it('sets Amplify AppID in team-provider-info if secrets are present', async () => {
    const functionSecretsStateManager = await FunctionSecretsStateManager.getInstance(context_stub);
    await functionSecretsStateManager.syncSecretDeltas({ TEST_SECRET: { operation: 'retain' } }, 'testFuncName');
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "testtest": Object {
          "categories": Object {
            "function": Object {
              "testFuncName": Object {
                "secretsPathAmplifyAppId": "testappid",
              },
            },
          },
        },
      }
    `);
  });

  it('removes Amplify AppId from team-provider-info if secrets are not present', async () => {
    const functionSecretsStateManager = await FunctionSecretsStateManager.getInstance(context_stub);
    await functionSecretsStateManager.syncSecretDeltas({ TEST_SECRET: { operation: 'remove' } }, 'testFuncName');
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1]).toMatchInlineSnapshot(`
      Object {
        "testtest": Object {
          "categories": Object {
            "function": Object {
              "testFuncName": Object {},
            },
          },
        },
      }
    `);
  });
});
