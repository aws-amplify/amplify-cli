import { $TSAny, stateManager } from '@aws-amplify/amplify-cli-core';
import { start } from '../../func';
import { getInvoker, getBuilder } from '@aws-amplify/amplify-category-function';
import _ from 'lodash';
import { prompter, printer } from '@aws-amplify/amplify-prompts';

jest.mock('../../utils/lambda/load-lambda-config', () => ({
  loadLambdaConfig: jest.fn(() => ({ handler: 'index.testHandle' })),
}));
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
  },
  pathManager: {
    getBackendDirPath: () => 'fake-backend-path',
  },
  stateManager: {
    getMeta: jest.fn().mockReturnValue({}),
  },
}));
jest.mock('@aws-amplify/amplify-category-function', () => ({
  getInvoker: jest.fn().mockResolvedValue(() => new Promise((resolve) => setTimeout(() => resolve('lambda value'), 10))),
  getBuilder: jest.fn().mockReturnValue(() => {}),
  isMockable: jest.fn().mockReturnValue({ isMockable: true }),
  category: 'function',
}));

jest.mock('@aws-amplify/amplify-prompts');

const getInvoker_mock = getInvoker as jest.MockedFunction<typeof getInvoker>;
const getBuilder_mock = getBuilder as jest.MockedFunction<typeof getBuilder>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
const prompter_mock = prompter as jest.Mocked<typeof prompter>;
const printer_mock = printer as jest.Mocked<typeof printer>;

const funcName = 'funcName';

describe('function start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const context_stub: $TSAny = {
    input: {
      subCommands: [funcName],
      options: {
        event: 'event.json',
        timeout: 1,
      },
    },
    amplify: {
      inputValidation: () => () => true,
      readJsonFile: jest.fn(),
      getResourceStatus: () => ({ allResources: [] }),
      getEnvInfo: () => ({ envName: 'testing' }),
    },
  };

  jest.setTimeout(1000 * 20);

  // NOTE: A warning from jest saying that async operations weren't stopped in the test is expected here
  // because the mock function is designed to keep running after the timeout to ensure that the timeout works
  it('times out function execution at the default time', async () => {
    getInvoker_mock.mockResolvedValueOnce(() => new Promise((resolve) => setTimeout(() => resolve('lambda value'), 11000)));
    context_stub.input.options.timeout = undefined;
    prompter_mock.pick.mockResolvedValue(['funcName']);
    await start(context_stub);
    expect(printer_mock.error.mock.calls[0][0]).toMatchInlineSnapshot(`"funcName failed with the following error:"`);
    expect(printer_mock.error.mock.calls[0][1]).toMatchSnapshot();
    context_stub.input.options.timeout = 1;
  });

  it('times out function execution at the specified time', async () => {
    getInvoker_mock.mockResolvedValueOnce(() => new Promise((resolve) => setTimeout(() => resolve('lambda value'), 2000)));
    await start(context_stub);
    expect(printer_mock.error.mock.calls[0][1]).toMatchSnapshot();
  });

  it('triggers a dev build before invoking', async () => {
    let isBuilt = false;
    getBuilder_mock.mockReturnValueOnce(async () => {
      isBuilt = true;
    });
    getInvoker_mock.mockResolvedValueOnce(async () => {
      if (!isBuilt) {
        throw new Error('Build was not called before invoke');
      }
    });

    await start(context_stub);
    expect(getBuilder_mock.mock.calls.length).toBe(1);
    expect(getInvoker_mock.mock.calls.length).toBe(1);
  });

  it('mocks function name specified in command line params', async () => {
    await start(context_stub);
    expect(getBuilder_mock.mock.calls[0][1]).toBe(funcName);
  });

  it('mocks function if only one function in the project', async () => {
    const context_stub_copy = _.merge({}, context_stub);
    delete context_stub_copy.input.subCommands;

    stateManager_mock.getMeta.mockReturnValueOnce({
      function: {
        func1: {},
      },
    });

    await start(context_stub_copy);

    expect(getBuilder_mock.mock.calls[0][1]).toBe('func1');
  });

  it('prompts for function name if none specified and project has multiple functions', async () => {
    const context_stub_copy = _.merge({}, context_stub);
    delete context_stub_copy.input.subCommands;

    stateManager_mock.getMeta.mockReturnValueOnce({
      function: {
        func1: {},
        func2: {},
        func3: {},
      },
    });

    prompter_mock.pick.mockResolvedValue(['func2']);

    await start(context_stub_copy);
    expect(prompter_mock.pick.mock.calls[0][1]).toStrictEqual(['func1', 'func2', 'func3']);
    expect(getBuilder_mock.mock.calls[0][1]).toBe('func2');
  });

  it('project has multiple functions and we dont specify a specific function, prompts for function names', async () => {
    // const context_stub_copy = _.merge({}, context_stub);
    const context_stub_copy = { ...context_stub };
    delete context_stub_copy.input.subCommands;

    stateManager_mock.getMeta.mockReturnValueOnce({
      function: {
        func1: {},
        func2: {},
        func3: {},
      },
    });

    prompter_mock.pick.mockResolvedValue(['func1', 'func2', 'func3']);

    await start(context_stub_copy);
    expect(prompter_mock.pick.mock.calls[0][1]).toStrictEqual(['func1', 'func2', 'func3']);

    expect(getBuilder_mock.mock.calls[0][1]).toBe('func1');
    expect(getBuilder_mock.mock.calls[1][1]).toBe('func2');
    expect(getBuilder_mock.mock.calls[2][1]).toBe('func3');
  });

  it('handles no options specified', async () => {
    const invoker = jest.fn().mockResolvedValue(null);
    getInvoker_mock.mockResolvedValueOnce(invoker);
    prompter_mock.input.mockResolvedValueOnce('event.json');

    const context_stub_copy = { ...context_stub };
    context_stub_copy.input.options = undefined;
    stateManager_mock.getMeta.mockReturnValueOnce({
      function: {
        func1: {},
      },
    });
    await start(context_stub_copy);
    expect(invoker.mock.calls.length).toBe(1);
    expect(printer_mock.error.mock.calls.length).toBe(0);
  });
});
