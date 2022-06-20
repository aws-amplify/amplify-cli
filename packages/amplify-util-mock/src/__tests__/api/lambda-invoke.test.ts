import { $TSContext } from 'amplify-cli-core';
import { invokeLambda } from '../../api/lambda-invoke';
import { ProcessedLambdaFunction } from '../../CFNParser/stack/types';
import { loadLambdaConfig } from '../../utils/lambda/load-lambda-config';
import { getInvoker, getBuilder } from 'amplify-category-function';
import { timeConstrainedInvoker } from '../../func';

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
const getInvoker_mock = getInvoker as jest.MockedFunction<typeof getInvoker>;
const getBuilder_mock = getBuilder as jest.MockedFunction<typeof getBuilder>;

  
jest.mock('../../func', () => ({
    timeConstrainedInvoker: jest.fn().mockResolvedValue({})
}));
const timeConstrainedInvokerMock = timeConstrainedInvoker as jest.MockedFunction<typeof timeConstrainedInvoker>;

const expectedLambdaConfig = { name: 'mocklambda', handler: 'mock.handler', environment: {} } as ProcessedLambdaFunction;
loadLambdaConfigMock.mockResolvedValue(expectedLambdaConfig);

const mockContext = {
    print: {
        success: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        blue: jest.fn(),
    }
} as unknown as $TSContext;

describe('Invoke local lambda function', () => {
  beforeEach(() => jest.clearAllMocks());

  it('invoke the local lambda with given data', async () => {
    let isBuilt = false;
    getInvoker_mock.mockResolvedValueOnce(() => new Promise(resolve => setTimeout(() => resolve('lambda value'), 11000)));
    getBuilder_mock.mockReturnValueOnce(async () => {
        isBuilt = true;
    });
    const echoInput = { key: 'value' };
    timeConstrainedInvokerMock.mockResolvedValue(echoInput);
    await invokeLambda(mockContext, 'lambda1', echoInput);
    expect(loadLambdaConfigMock.mock.calls[0][1]).toEqual('lambda1');
    expect(mockContext.print.info).toBeCalledWith(JSON.stringify(echoInput, undefined, 2));
    expect(mockContext.print.error).toBeCalledTimes(0);
    expect(mockContext.print.blue).toBeCalledWith('Finished execution.');
  });
});
