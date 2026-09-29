import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { invokeTrigger } from '../../api/lambda-invoke';
import { ProcessedLambdaFunction } from '../../CFNParser/stack/types';
import { loadLambdaConfig } from '../../utils/lambda/load-lambda-config';
import { getInvoker, getBuilder } from '@aws-amplify/amplify-category-function';
import { timeConstrainedInvoker } from '../../func';
import { printer } from '@aws-amplify/amplify-prompts';

jest.mock('@aws-amplify/amplify-prompts');

jest.mock('../../utils/lambda/load-lambda-config', () => ({
  loadLambdaConfig: jest.fn(),
}));
const loadLambdaConfigMock = loadLambdaConfig as jest.MockedFunction<typeof loadLambdaConfig>;

jest.mock('@aws-amplify/amplify-category-function', () => ({
  getInvoker: jest.fn().mockResolvedValue(() => new Promise((resolve) => setTimeout(() => resolve('lambda value'), 10))),
  getBuilder: jest.fn().mockReturnValue(() => {}),
  isMockable: jest.fn().mockReturnValue({ isMockable: true }),
  category: 'function',
}));
const getInvokerMock = getInvoker as jest.MockedFunction<typeof getInvoker>;
const getBuilderMock = getBuilder as jest.MockedFunction<typeof getBuilder>;

jest.mock('../../func', () => ({
  timeConstrainedInvoker: jest.fn().mockResolvedValue({}),
}));
const timeConstrainedInvokerMock = timeConstrainedInvoker as jest.MockedFunction<typeof timeConstrainedInvoker>;

const expectedLambdaConfig = { name: 'mocklambda', handler: 'mock.handler', environment: {} } as ProcessedLambdaFunction;
loadLambdaConfigMock.mockResolvedValue(expectedLambdaConfig);

const mockContext = {} as $TSContext;

describe('Invoke local lambda function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    printer.info = jest.fn();
    printer.success = jest.fn();
    printer.error = jest.fn();
  });

  it('invoke the local lambda using name with given data', async () => {
    let isBuilt = false;
    getInvokerMock.mockResolvedValueOnce(() => new Promise((resolve) => setTimeout(() => resolve('lambda value'), 11000)));
    getBuilderMock.mockReturnValueOnce(async () => {
      isBuilt = true;
    });
    const echoInput = { key: 'value' };
    timeConstrainedInvokerMock.mockResolvedValue(echoInput);
    await invokeTrigger(mockContext, { name: 'lambda1' }, echoInput);
    expect(loadLambdaConfigMock.mock.calls[0][1]).toEqual('lambda1');
    expect(printer.info).toBeCalledWith(JSON.stringify(echoInput, undefined, 2));
    expect(printer.error).toBeCalledTimes(0);
    expect(printer.info).toBeCalledWith('Finished execution.');
    expect(isBuilt).toBe(true);
  });

  it('invoke the local lambda using trigger config with given data', async () => {
    const mockInvoke = jest.fn().mockReturnValue({});
    const mockBuild = jest.fn().mockReturnValue({});
    const mockCheckDeps = jest.fn().mockReturnValue({ hasRequiredDependencies: true });

    mockContext['amplify'] = {
      loadRuntimePlugin: jest.fn().mockReturnValue({
        checkDependencies: mockCheckDeps,
        package: jest.fn().mockReturnValue({}),
        build: mockBuild,
        invoke: mockInvoke,
      }),
    } as $TSAny;

    getInvokerMock.mockResolvedValueOnce(() => new Promise((resolve) => setTimeout(() => resolve('lambda value'), 11000)));
    const echoInput = { key: 'value' };
    timeConstrainedInvokerMock.mockResolvedValue(echoInput);
    const mockTriggerConfig = {
      runtimePluginId: 'amplify-python-function-runtime-provider',
      handler: 'index.handler',
      runtime: 'python',
      directory: 'mock-lambda-trigger',
      reBuild: true,
      envVars: { ENV_KEY: 'env_value' },
    };
    await invokeTrigger(mockContext, { config: mockTriggerConfig }, echoInput);
    expect(mockContext.amplify.loadRuntimePlugin).toBeCalledTimes(1);
    expect(mockContext.amplify.loadRuntimePlugin).toBeCalledWith(mockContext, mockTriggerConfig.runtimePluginId);

    // check for lambda dependencies
    expect(mockCheckDeps).toBeCalledTimes(1);
    expect(mockCheckDeps).toBeCalledWith(mockTriggerConfig.runtime);

    // ensure latest lambda changes are built
    expect(mockBuild).toBeCalledTimes(1);
    expect(mockBuild).toBeCalledWith({
      buildType: 'DEV',
      runtime: mockTriggerConfig.runtime,
      srcRoot: mockTriggerConfig.directory,
    });

    // ensure lambda trigger is invoked with correct input
    expect(mockInvoke).toBeCalledTimes(1);
    expect(mockInvoke).toBeCalledWith({
      handler: mockTriggerConfig.handler,
      event: JSON.stringify(echoInput),
      runtime: mockTriggerConfig.runtime,
      srcRoot: mockTriggerConfig.directory,
      envVars: mockTriggerConfig.envVars,
    });
    expect(printer.info).toBeCalledWith('Finished execution.');

    // Below call is for triggers provisioned using functions category
    expect(loadLambdaConfigMock).toBeCalledTimes(0);
  });
});
