import * as printerDependency from '@aws-amplify/amplify-prompts';
import * as JSONUtilitiesDependency from '@aws-amplify/amplify-cli-core';
import { notifyMissingPackages } from '../commands/utils/notifyMissingPackages';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('@aws-amplify/amplify-cli-core');
printerDependency.printer.info = jest.fn();
printerDependency.printer.debug = jest.fn();
printerDependency.printer.warn = jest.fn();

describe('should notify when packages are missing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    JSONUtilitiesDependency.JSONUtilities.readJson = jest.fn().mockImplementation(() => ({
      projectPath: __dirname,
      dependencies: [],
    }));
  });
  it('skips notification if localEnv path cannot be determined', async () => {
    const context = {
      input: {
        options: {
          localEnvFilePath: 'fake',
        },
      },
    };
    notifyMissingPackages(context as unknown as $TSContext, false);
    expect(printerDependency.printer.debug).toBeCalledTimes(1);
  });

  it('skips notification if package.json cannot be determined', async () => {
    JSONUtilitiesDependency.JSONUtilities.readJson = jest.fn().mockImplementation(() => ({
      projectPath: 'asdf',
      dependencies: [],
    }));
    const context = {
      input: {
        options: {
          localEnvFilePath: __dirname + '/mock.json',
        },
      },
    };
    notifyMissingPackages(context as unknown as $TSContext, false);
    expect(printerDependency.printer.debug).toBeCalledTimes(1);
  });

  it('notifies for all missing dependencies', async () => {
    const context = {
      input: {
        options: {
          localEnvFilePath: __dirname + '/mock.json',
        },
      },
    };
    notifyMissingPackages(context as unknown as $TSContext, true);
    expect(printerDependency.printer.warn).toBeCalledTimes(3);
  });

  it('notifies for partial missing dependencies', async () => {
    JSONUtilitiesDependency.JSONUtilities.readJson = jest.fn().mockImplementation(() => ({
      projectPath: __dirname,
      dependencies: { '@aws-amplify/ui-react': '4.6.0' },
    }));
    const context = {
      input: {
        options: {
          localEnvFilePath: __dirname + '/mock.json',
        },
      },
    };
    notifyMissingPackages(context as unknown as $TSContext);
    expect(printerDependency.printer.warn).toBeCalledTimes(1);
  });

  it('notifies for all dependencies except storage if user is not using StorageManager', () => {
    const context = {
      input: {
        options: {
          localEnvFilePath: __dirname + '/mock.json',
        },
      },
    };
    notifyMissingPackages(context as unknown as $TSContext, false);
    expect(printerDependency.printer.warn).toBeCalledTimes(2);
  });
});
