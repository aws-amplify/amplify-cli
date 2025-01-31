import * as printerDependency from '@aws-amplify/amplify-prompts';
import * as JSONUtilitiesDependency from '@aws-amplify/amplify-cli-core';
import { getStartCodegenJobDependencies, notifyMissingPackages } from '../commands/utils/notifyMissingPackages';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('@aws-amplify/amplify-cli-core');
printerDependency.printer.info = jest.fn();
printerDependency.printer.debug = jest.fn();
printerDependency.printer.warn = jest.fn();

const dependencies = [
  {
    name: '@aws-amplify/ui-react',
    supportedVersion: '>=4.6.0  <6.0.0',
    reason: 'Required to leverage Amplify UI primitives, and Amplify Studio component functions.',
  },
  {
    name: 'aws-amplify',
    supportedVersion: '^5.0.2',
    reason: 'Required to leverage DataStore.',
  },
  {
    name: '@aws-amplify/ui-react-storage',
    supportedVersion: '^1.1.0',
    reason: 'Required to leverage StorageManager.',
  },
];

describe('should notify when packages are missing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    JSONUtilitiesDependency.JSONUtilities.readJson = jest.fn().mockImplementation(() => ({
      projectPath: __dirname,
      dependencies: {},
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
    expect(printerDependency.printer.debug).toBeCalledTimes(2);
  });

  it('skips notification if package.json cannot be determined', async () => {
    JSONUtilitiesDependency.JSONUtilities.readJson = jest.fn().mockImplementation(() => ({
      projectPath: 'asdf',
      dependencies: {},
    }));
    const context = {
      input: {
        options: {
          localEnvFilePath: __dirname + '/mock.json',
        },
      },
    };
    notifyMissingPackages(context as unknown as $TSContext, false);
    expect(printerDependency.printer.debug).toBeCalledTimes(2);
  });

  it('notifies for all missing dependencies', async () => {
    const context = {
      input: {
        options: {
          localEnvFilePath: __dirname + '/mock.json',
        },
      },
    };
    notifyMissingPackages(context as unknown as $TSContext, true, dependencies);
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
    notifyMissingPackages(context as unknown as $TSContext, false, dependencies);
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
    notifyMissingPackages(context as unknown as $TSContext, false, dependencies);
    expect(printerDependency.printer.warn).toBeCalledTimes(2);
  });

  it('should return required dependencies from package.json', () => {
    const packageJsonDependencies = {
      '@aws-amplify/ui-react': '4.6.0',
      'aws-amplify': '^5.0.2',
      '@aws-amplify/ui-react-storage': '^1.2.0',
    };
    const deps = getStartCodegenJobDependencies({ dependencies: { ...packageJsonDependencies, 'random-dependency': '1.0.0' } });
    expect(deps).toMatchObject(packageJsonDependencies);
  });
});
