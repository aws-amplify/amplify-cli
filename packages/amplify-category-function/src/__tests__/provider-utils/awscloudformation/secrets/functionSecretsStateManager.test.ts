import { $TSContext, stateManager, pathManager, AmplifyError } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import { getEnvParamManager, ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { FunctionSecretsStateManager } from '../../../../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import * as stateManagerModule from '../../../../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { getAppId, getFunctionSecretPrefix } from '../../../../provider-utils/awscloudformation/secrets/secretName';
import { SSMClientWrapper } from '../../../../provider-utils/awscloudformation/secrets/ssmClientWrapper';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../../../../provider-utils/awscloudformation/secrets/ssmClientWrapper');
jest.mock('../../../../provider-utils/awscloudformation/secrets/secretsCfnModifier');
jest.mock('../../../../provider-utils/awscloudformation/secrets/secretName');
jest.mock('../../../../provider-utils/awscloudformation/utils/updateTopLevelComment');
jest.mock('../../../../provider-utils/awscloudformation/utils/cloudformationHelpers');

const stateManagerMock = jest.mocked(stateManager);
const pathManagerMock = jest.mocked(pathManager);
const getAppIdMock = jest.mocked(getAppId);
const SSMClientWrapperMock = jest.mocked(SSMClientWrapper);
const getFunctionSecretPrefixMock = jest.mocked(getFunctionSecretPrefix);
const AmplifyErrorMock = AmplifyError as jest.MockedClass<typeof AmplifyError>;

const amplifyErrorMockImpl = { name: 'TestError' } as unknown as AmplifyError;
AmplifyErrorMock.mockImplementation(() => amplifyErrorMockImpl);

stateManagerMock.getLocalEnvInfo.mockReturnValue({
  envName: 'testTest',
});
stateManagerMock.getTeamProviderInfo.mockReturnValue({});

stateManagerMock.setTeamProviderInfo.mockReturnValue();

pathManagerMock.getBackendDirPath.mockReturnValue(path.join('test', 'path'));

getAppIdMock.mockReturnValue('testAppId');

const getSecretNamesByPathMock = jest.fn();

SSMClientWrapperMock.getInstance.mockResolvedValue({
  deleteSecret: jest.fn(),
  setSecret: jest.fn(),
  getSecretNamesByPath: getSecretNamesByPathMock,
} as unknown as SSMClientWrapper);

const getLocalFunctionSecretNamesSpy = jest.spyOn(stateManagerModule, 'getLocalFunctionSecretNames');

const invokePluginMethodMock = jest.fn();
const contextStub = {
  parameters: {
    command: 'update',
  },
  input: {
    options: {
      yes: true,
    },
  },
  amplify: {
    invokePluginMethod: invokePluginMethodMock,
  },
} as unknown as $TSContext;
let functionSecretsStateManager: FunctionSecretsStateManager;

beforeAll(async () => {
  functionSecretsStateManager = await FunctionSecretsStateManager.getInstance(contextStub);
});

beforeEach(() => jest.clearAllMocks());

describe('syncSecretDeltas', () => {
  it('sets Amplify AppID in team-provider-info if secrets are present', async () => {
    await functionSecretsStateManager.syncSecretDeltas({ TEST_SECRET: { operation: 'retain' } }, 'testFuncName');
    expect(getEnvParamManager('testTest').getResourceParamManager('function', 'testFuncName').getAllParams()).toEqual({
      secretsPathAmplifyAppId: 'testAppId',
    });
  });

  it('removes Amplify AppId from team-provider-info if secrets are not present', async () => {
    await functionSecretsStateManager.syncSecretDeltas({ TEST_SECRET: { operation: 'remove' } }, 'testFuncName');
    expect(getEnvParamManager('testTest').getResourceParamManager('function', 'testFuncName').getAllParams()).toEqual({});
  });
});

describe('ensureNewLocalSecretsSyncedToCloud in non interactive mode', () => {
  it('doesnt throws AmplifyError if function secret is PS and secretsPathAmplifyAppId is defined', async () => {
    // set secrets in
    invokePluginMethodMock.mockResolvedValue((key: string) => true);
    const funcName = 'testFunc';
    (await ensureEnvParamManager('testTest')).instance
      .getResourceParamManager('function', funcName)
      .setParam('secretsPathAmplifyAppId', 'existingParamValue');
    const secretPrefix = 'testPrefix';
    getFunctionSecretPrefixMock.mockReturnValue(secretPrefix);
    getLocalFunctionSecretNamesSpy.mockReturnValue(['secret1', 'secret2']);
    getSecretNamesByPathMock.mockResolvedValue(['secret2'].map((sec) => `${secretPrefix}${sec}`));

    await expect(functionSecretsStateManager.ensureNewLocalSecretsSyncedToCloud(funcName)).toMatchInlineSnapshot(`Promise {}`);
  });

  it('throws AmplifyError if secrets value are missing in parameter store', async () => {
    const secretPrefix = 'testPrefix';
    const funcName = 'testFunc';
    (await ensureEnvParamManager('testTest')).instance
      .getResourceParamManager('function', funcName)
      .setParam('secretsPathAmplifyAppId', 'existingParamValue');
    invokePluginMethodMock.mockResolvedValue((key: string) => false);
    getFunctionSecretPrefixMock.mockReturnValue(secretPrefix);
    getLocalFunctionSecretNamesSpy.mockReturnValue(['secret1', 'secret2']);
    getSecretNamesByPathMock.mockResolvedValue(['secret2'].map((sec) => `${secretPrefix}${sec}`));

    await expect(functionSecretsStateManager.ensureNewLocalSecretsSyncedToCloud(funcName)).rejects.toStrictEqual(amplifyErrorMockImpl);
  });

  it('throws AmplifyError if secrets key not set in envParamsManager', async () => {
    const funcName = 'testFunc';
    const secretPrefix = 'testPrefix';
    (await ensureEnvParamManager('testTest')).instance.getResourceParamManager('function', funcName).deleteParam('secretsPathAmplifyAppId');
    getFunctionSecretPrefixMock.mockReturnValue(secretPrefix);
    getLocalFunctionSecretNamesSpy.mockReturnValue(['secret1', 'secret2']);
    getSecretNamesByPathMock.mockResolvedValue(['secret2'].map((sec) => `${secretPrefix}${sec}`));

    await expect(functionSecretsStateManager.ensureNewLocalSecretsSyncedToCloud(funcName)).rejects.toStrictEqual(amplifyErrorMockImpl);
  });
});
