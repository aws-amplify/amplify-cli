describe('should notify when packages are missing', () => {
  let printer: any;
  let JSONUtilities: any;
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mock('amplify-prompts');
    printer = require('amplify-prompts').printer;

    jest.mock('amplify-cli-core');
    JSONUtilities = require('amplify-cli-core').JSONUtilities;
    JSONUtilities.readJson.mockImplementation(() => ({
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
    const { notifyMissingPackages } = require('../commands/utils/notifyMissingPackages');
    notifyMissingPackages(context);
    expect(printer.debug).toBeCalledTimes(1);
  });

  it('skips notification if package.json cannot be determined', async () => {
    JSONUtilities.readJson.mockImplementation(() => ({
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
    const { notifyMissingPackages } = require('../commands/utils/notifyMissingPackages');
    notifyMissingPackages(context);
    expect(printer.debug).toBeCalledTimes(1);
  });

  it('notifies for all missing dependencies', async () => {
    const context = {
      input: {
        options: {
          localEnvFilePath: __dirname + '/mock.json',
        },
      },
    };
    const { notifyMissingPackages } = require('../commands/utils/notifyMissingPackages');
    notifyMissingPackages(context);
    expect(printer.warn).toBeCalledTimes(2);
  });

  it('notifies for partial missing dependencies', async () => {
    JSONUtilities.readJson.mockImplementation(() => ({
      projectPath: __dirname,
      dependencies: { '@aws-amplify/ui-react': '1.0.0' },
    }));
    const context = {
      input: {
        options: {
          localEnvFilePath: __dirname + '/mock.json',
        },
      },
    };
    const { notifyMissingPackages } = require('../commands/utils/notifyMissingPackages');
    notifyMissingPackages(context);
    expect(printer.warn).toBeCalledTimes(1);
  });
});
