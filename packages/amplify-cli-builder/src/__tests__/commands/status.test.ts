describe('amplify status: ', () => {
  const { run } = require('../../commands/status');
  const runStatusCmd = run;
  const statusPluginInfo = `${process.cwd()}/../amplify-console-hosting`;
  const mockPath = './';

  it('status run method should exist', () => {
    expect(runStatusCmd).toBeDefined();
  });

  it('status run method should call context.amplify.showStatusTable', async () => {
    const mockContextNoCLArgs = {
      amplify: {
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: mockPath }),
      },
      parameters: {
        input: {
          command: 'status',
          subCommands: [],
          options: {
            verbose: true,
          },
        },
      },
    };
    runStatusCmd(mockContextNoCLArgs);
    expect(mockContextNoCLArgs.amplify.showStatusTable).toBeCalled();
  });

  it('status -v run method should call context.amplify.showStatusTable', async () => {
    const mockContextWithVerboseOptionAndCLArgs = {
      amplify: {
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: statusPluginInfo }),
      },
      input: {
        command: 'status',
        options: {
          verbose: true,
        },
      },
    };
    runStatusCmd(mockContextWithVerboseOptionAndCLArgs);
    expect(mockContextWithVerboseOptionAndCLArgs.amplify.showStatusTable).toBeCalled();
  });

  it('status -v <category>* run method should call context.amplify.showStatusTable', async () => {
    const mockContextWithVerboseOptionWithCategoriesAndCLArgs = {
      amplify: {
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: statusPluginInfo }),
      },
      input: {
        command: 'status',
        options: {
          verbose: true,
          api: true,
          storage: true,
        },
      },
    };

    runStatusCmd(mockContextWithVerboseOptionWithCategoriesAndCLArgs);
    expect(mockContextWithVerboseOptionWithCategoriesAndCLArgs.amplify.showStatusTable).toBeCalled();
  });

  it('status help run method should call ViewResourceTableParams.getStyledHelp', async () => {
    const mockContextWithHelpSubcommandAndCLArgs = {
      amplify: {
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: statusPluginInfo }),
      },
      input: {
        command: 'status',
        subCommands: ['help'],
      },
    };
    runStatusCmd(mockContextWithHelpSubcommandAndCLArgs);
    //TBD: to move ViewResourceTableParams into a separate file for mocking instance functions.
    expect(mockContextWithHelpSubcommandAndCLArgs.amplify.showStatusTable.mock.calls.length).toBe(0);
  });
});
