import { $TSContext } from 'amplify-cli-core';
import { invokeLambda } from '../../api/lambda-invoke';
import { ProcessedLambdaFunction } from '../../CFNParser/stack/types';
import { loadLambdaConfig } from '../../utils/lambda/load-lambda-config';
import { getInvoker, getBuilder } from 'amplify-category-function';
import { timeConstrainedInvoker } from '../../func';
import { printer } from 'amplify-prompts';

jest.mock('amplify-prompts');

jest.mock('../../utils/lambda/load-lambda-config', () => ({
  loadLambdaConfig: jest.fn()
}));
const loadLambdaConfigMock = loadLambdaConfig as jest.MockedFunction<typeof loadLambdaConfig>;

jest.mock('amplify-category-function', () => ({
    getInvoker: jest.fn().mockResolvedValue(() => new Promise(resolve => setTimeout(() => resolve('lambda value'), 10))),
    getBuilder: jest.fn().mockReturnValue(() => {}),
    isMockable: jest.fn().mockReturnValue({ isMockable: true }),
    category: 'function',
}));
const getInvokerMock = getInvoker as jest.MockedFunction<typeof getInvoker>;
const getBuilderMock = getBuilder as jest.MockedFunction<typeof getBuilder>;

  
jest.mock('../../func', () => ({
    timeConstrainedInvoker: jest.fn().mockResolvedValue({})
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

  it('invoke the local lambda with given data', async () => {
    let isBuilt = false;
    getInvokerMock.mockResolvedValueOnce(() => new Promise(resolve => setTimeout(() => resolve('lambda value'), 11000)));
    getBuilderMock.mockReturnValueOnce(async () => {
        isBuilt = true;
    });
    const echoInput = { key: 'value' };
    timeConstrainedInvokerMock.mockResolvedValue(echoInput);
    await invokeLambda(mockContext, 'lambda1', echoInput);
    expect(loadLambdaConfigMock.mock.calls[0][1]).toEqual('lambda1');
    expect(printer.info).toBeCalledWith(JSON.stringify(echoInput, undefined, 2));
    expect(printer.error).toBeCalledTimes(0);
    expect(printer.info).toBeCalledWith('Finished execution.');
  });
});
