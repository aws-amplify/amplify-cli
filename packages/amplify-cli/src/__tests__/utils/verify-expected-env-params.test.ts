import { getChangedResources } from '../../commands/build';
import { prompter } from '@aws-amplify/amplify-prompts';
import { ensureEnvParamManager, IEnvironmentParameterManager } from '@aws-amplify/amplify-environment-parameters';
import { verifyExpectedEnvParams } from '../../utils/verify-expected-env-params';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

jest.mock('../../commands/build');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('@aws-amplify/amplify-environment-parameters');
jest.mock('@aws-amplify/amplify-provider-awscloudformation');
jest.mock('@aws-amplify/amplify-cli-core');

const getResourcesMock = getChangedResources as jest.MockedFunction<typeof getChangedResources>;
const ensureEnvParamManagerMock = ensureEnvParamManager as jest.MockedFunction<typeof ensureEnvParamManager>;
const prompterMock = prompter as jest.Mocked<typeof prompter>;

const verifyExpectedEnvParametersMock = jest.fn();
const getMissingParametersMock = jest.fn();
const saveMock = jest.fn();

ensureEnvParamManagerMock.mockResolvedValue({
  instance: {
    verifyExpectedEnvParameters: verifyExpectedEnvParametersMock,
    getMissingParameters: getMissingParametersMock,
    save: saveMock,
    getResourceParamManager: jest.fn().mockReturnValue({
      setParam: jest.fn(),
    }),
    downloadParameters: jest.fn(),
  } as unknown as IEnvironmentParameterManager,
});

const resourceList = [
  {
    category: 'storage',
    resourceName: 'testStorage',
    service: 'S3',
  },
  {
    category: 'function',
    resourceName: 'testFunction',
    service: 'Lambda',
  },
];

getResourcesMock.mockResolvedValue(resourceList);

const resetContext = {
  exeInfo: {
    inputParams: {
      yes: true,
    },
  },
  amplify: {
    invokePluginMethod: jest.fn(),
  },
} as unknown as $TSContext;

describe('verifyExpectedEnvParams', () => {
  let contextStub = resetContext;
  beforeEach(() => {
    jest.clearAllMocks();
    contextStub = resetContext;
  });
  it('filters parameters based on category and resourceName if specified', async () => {
    await verifyExpectedEnvParams(contextStub, 'storage');
    expect(verifyExpectedEnvParametersMock).toHaveBeenCalledWith([resourceList[0]], undefined, undefined);
  });

  it('calls verify expected parameters if in non-interactive mode', async () => {
    await verifyExpectedEnvParams(contextStub, 'storage');
    expect(verifyExpectedEnvParametersMock).toHaveBeenCalled();
    expect(getMissingParametersMock).not.toHaveBeenCalled();
  });

  it('prompts for missing parameters if in interactive mode', async () => {
    contextStub.exeInfo.inputParams.yes = false;
    getMissingParametersMock.mockResolvedValue([
      {
        categoryName: 'function',
        resourceName: 'testFunction',
        parameterName: 'something',
      },
    ]);
    await verifyExpectedEnvParams(contextStub, 'storage');
    expect(verifyExpectedEnvParametersMock).not.toHaveBeenCalled();
    expect(prompterMock.input).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
  });
});
