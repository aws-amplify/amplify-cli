import { $TSContext, stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { mocked } from 'ts-jest/utils';
import * as path from 'path';
import { getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { FunctionSecretsStateManager } from '../../../../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { getAppId } from '../../../../provider-utils/awscloudformation/secrets/secretName';
import { SSMClientWrapper } from '../../../../provider-utils/awscloudformation/secrets/ssmClientWrapper';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/secrets/ssmClientWrapper');
jest.mock('../../../../provider-utils/awscloudformation/secrets/secretsCfnModifier');
jest.mock('../../../../provider-utils/awscloudformation/secrets/secretName');
jest.mock('../../../../provider-utils/awscloudformation/utils/updateTopLevelComment');
jest.mock('../../../../provider-utils/awscloudformation/utils/cloudformationHelpers');

const stateManagerMock = mocked(stateManager);
const pathManagerMock = mocked(pathManager);
const getAppIdMock = mocked(getAppId);
const SSMClientWrapperMock = mocked(SSMClientWrapper);

stateManagerMock.getLocalEnvInfo.mockReturnValue({
  envName: 'testTest',
});
stateManagerMock.getTeamProviderInfo.mockReturnValue({});

pathManagerMock.getBackendDirPath.mockReturnValue(path.join('test', 'path'));

getAppIdMock.mockReturnValue('testAppId');

SSMClientWrapperMock.getInstance.mockResolvedValue({
  deleteSecret: jest.fn(),
  setSecret: jest.fn(),
} as unknown as SSMClientWrapper);

describe('syncSecretDeltas', () => {
  const contextStub = {
    parameters: {
      command: 'update',
    },
  } as unknown as $TSContext;
  beforeEach(jest.clearAllMocks);

  it('sets Amplify AppID in team-provider-info if secrets are present', async () => {
    const functionSecretsStateManager = await FunctionSecretsStateManager.getInstance(contextStub);
    await functionSecretsStateManager.syncSecretDeltas({ TEST_SECRET: { operation: 'retain' } }, 'testFuncName');
    expect(getEnvParamManager('testTest').getResourceParamManager('function', 'testFuncName').getAllParams()).toEqual({
      secretsPathAmplifyAppId: 'testAppId',
    });
  });

  it('removes Amplify AppId from team-provider-info if secrets are not present', async () => {
    const functionSecretsStateManager = await FunctionSecretsStateManager.getInstance(contextStub);
    await functionSecretsStateManager.syncSecretDeltas({ TEST_SECRET: { operation: 'remove' } }, 'testFuncName');
    expect(getEnvParamManager('testTest').getResourceParamManager('function', 'testFuncName').getAllParams()).toEqual({});
  });
});
