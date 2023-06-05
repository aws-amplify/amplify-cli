import { $TSContext, stateManager, pathManager, AmplifyError } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import { getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
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

pathManagerMock.getBackendDirPath.mockReturnValue(path.join('test', 'path'));

getAppIdMock.mockReturnValue('testAppId');

const getSecretNamesByPathMock = jest.fn();

SSMClientWrapperMock.getInstance.mockResolvedValue({
  deleteSecret: jest.fn(),
  setSecret: jest.fn(),
  getSecretNamesByPath: getSecretNamesByPathMock,
} as unknown as SSMClientWrapper);

const getLocalFunctionSecretNamesSpy = jest.spyOn(stateManagerModule, 'getLocalFunctionSecretNames');

const contextStub = {
  parameters: {
    command: 'update',
  },
  input: {
    options: {
      yes: true,
    },
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

describe('ensureNewLocalSecretsSyncedToCloud', () => {
  it('throws AmplifyError if secrets are missing and not in interactive mode', async () => {
    const funcName = 'testFunc';
    const secretPrefix = 'testPrefix';
    getFunctionSecretPrefixMock.mockReturnValue(secretPrefix);
    getLocalFunctionSecretNamesSpy.mockReturnValue(['secret1', 'secret2']);
    getSecretNamesByPathMock.mockResolvedValue(['secret2'].map((sec) => `${secretPrefix}${sec}`));

    await expect(functionSecretsStateManager.ensureNewLocalSecretsSyncedToCloud(funcName)).rejects.toStrictEqual(amplifyErrorMockImpl);
  });
});
