import { start } from '../../func';

jest.mock('../../utils/lambda/loadMinimal', () => ({
  loadMinimalLambdaConfig: jest.fn(() => ({ handler: 'index.testHandle' })),
}));
jest.mock('../../utils', () => ({
  hydrateAllEnvVars: jest.fn(),
}));
jest.mock('amplify-category-function', () => ({
  getInvoker: () => () => new Promise(resolve => setTimeout(() => resolve('lambda value'), 1000 * 19)),
  isMockable: () => ({ isMockable: true }),
  category: 'function',
}));

describe('function start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const context_stub = {
    input: {
      subCommands: ['funcName'],
      options: {
        event: 'event.json',
        timeout: undefined,
      },
    },
    amplify: {
      pathManager: {
        getBackendDirPath: jest.fn(() => 'backend-path'),
      },
      inputValidation: () => () => true,
      readJsonFile: jest.fn(),
      getResourceStatus: () => ({ allResources: [] }),
      getEnvInfo: () => ({ envName: 'testing' }),
    },
    print: {
      success: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    },
  };

  jest.setTimeout(1000 * 20);

  // NOTE: A warning from jest saying that async operations weren't stopped in the test is expected here
  // because the mock function is designed to keep running after the timeout to ense that the timeout works
  it('times out function execution at the default time', async () => {
    await start(context_stub);
    expect(context_stub.print.error.mock.calls[0][0]).toMatchInlineSnapshot(`"funcName failed with the following error:"`);
    expect(context_stub.print.info.mock.calls[0][0]).toMatchSnapshot();
  });

  it('times out function execution at the specified time', async () => {
    context_stub.input.options.timeout = '12';
    await start(context_stub);
    expect(context_stub.print.info.mock.calls[0][0]).toMatchSnapshot();
  });
});
