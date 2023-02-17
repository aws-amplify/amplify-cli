describe('amplify env: ', () => {
  const mockExit = jest.fn();
  jest.mock('amplify-cli-core', () => ({
    exitOnNextTick: mockExit,
    pathManager: { getAmplifyMetaFilePath: jest.fn().mockReturnValue('test_file_does_not_exist') },
    constants: jest.requireActual('amplify-cli-core').constants,
  }));
  const { run: runEnvCmd } = require('../../commands/env');
  const { run: runAddEnvCmd } = require('../../commands/env/add');
  const envList = require('../../commands/env/list');
  jest.mock('../../commands/env/list');

  it('env run method should exist', () => {
    expect(runEnvCmd).toBeDefined();
  });

  it('env add method should exist', () => {
    expect(runAddEnvCmd).toBeDefined();
  });

  it('env add method should throw if meta file does not exist', () => {
    expect(async () => await runAddEnvCmd()).rejects.toThrow();
  });

  it('env ls is an alias for env list', async () => {
    const mockEnvListRun = jest.spyOn(envList, 'run');
    await runEnvCmd({
      input: {
        subCommands: ['list'],
      },
      parameters: {},
    });
    await runEnvCmd({
      input: {
        subCommands: ['ls'],
      },
      parameters: {},
    });
    expect(mockEnvListRun).toHaveBeenCalledTimes(2);
  });

  it('invalid env subcommand should give a warning', async () => {
    const mockContextInvalidEnvSubcommand = {
      amplify: {
        showHelp: jest.fn(),
      },
      parameters: {},
      input: {
        subCommands: ['test12345'],
      },
      print: {
        warning: jest.fn(),
        info: jest.fn(),
      },
    };
    await runEnvCmd(mockContextInvalidEnvSubcommand);
    expect(mockContextInvalidEnvSubcommand.amplify.showHelp).toBeCalled();
    expect(mockContextInvalidEnvSubcommand.print.warning.mock.calls[0][0]).toMatchInlineSnapshot(
      `"Cannot find command: 'amplify env test12345'"`,
    );
  });
});
