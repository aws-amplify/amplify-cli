import { $TSAny } from 'amplify-cli-core';
import { start } from '../../func';
import { getInvoker, getBuilder } from 'amplify-category-function';
import { stateManager } from 'amplify-cli-core';
import * as _ from 'lodash';
import * as inquirer from 'inquirer';

jest.mock('../../utils/lambda/load-lambda-config', () => ({
  loadLambdaConfig: jest.fn(() => ({ handler: 'index.testHandle' })),
}));
jest.mock('../../utils', () => ({
  hydrateAllEnvVars: jest.fn(),
}));
jest.mock('amplify-cli-core', () => ({
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
jest.mock('amplify-category-function', () => ({
  getInvoker: jest.fn().mockResolvedValue(() => new Promise(resolve => setTimeout(() => resolve('lambda value'), 1000 * 19))),
  getBuilder: jest.fn().mockReturnValue(() => {}),
  isMockable: jest.fn().mockReturnValue({ isMockable: true }),
  category: 'function',
}));

jest.mock('inquirer');
const inquirer_mock = inquirer as jest.Mocked<typeof inquirer>;

const getInvoker_mock = getInvoker as jest.MockedFunction<typeof getInvoker>;
const getBuilder_mock = getBuilder as jest.MockedFunction<typeof getBuilder>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

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
        timeout: undefined,
      },
    },
    amplify: {
      inputValidation: () => () => true,
      readJsonFile: jest.fn(),
      getResourceStatus: () => ({ allResources: [] }),
      getEnvInfo: () => ({ envName: 'testing' }),
    },
    print: {
      success: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      blue: jest.fn(),
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

    inquirer_mock.prompt.mockResolvedValueOnce({ resourceName: 'func2' });

    await start(context_stub_copy);

    expect(inquirer_mock.prompt.mock.calls[0][0][0].choices).toStrictEqual(['func1', 'func2', 'func3']);
    expect(getBuilder_mock.mock.calls[0][1]).toBe('func2');
  });
});
