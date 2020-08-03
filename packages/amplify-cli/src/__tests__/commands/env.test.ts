import { run as runEnvCmd } from '../../commands/env';

describe('amplify env: ', () => {
  it('env run method should exist', () => {
    expect(runEnvCmd).toBeDefined();
  });

  const mockContextNoCLArgs = {
    amplify: {
      showHelp: jest.fn(),
    },
    parameters: {},
    input: {
      subCommands: [],
    },
    print: {
      info: jest.fn(),
    },
  };

  describe('case: amplify env is run with no additional command line arguments', () => {
    it('env run method should call context.amplify.showHelp()', async () => {
      await runEnvCmd(mockContextNoCLArgs);
      expect(mockContextNoCLArgs.amplify.showHelp).toBeCalled();
    });
  });

  const mockContextInvalidSubcommandCLArgs = {
    amplify: {
      showHelp: jest.fn(),
    },
    parameters: {},
    input: {
      argv: [
        '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
        '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
        'foo',
        'bar',
        'piyo',
      ],
      subCommands: ['foo', 'bar', 'piyo'],
    },
    print: {
      info: jest.fn(),
      warning: jest.fn(),
    },
  };

  describe('case: amplify env is run with invalid additional command line arguments', () => {
    it('env run method should call context.amplify.showHelp() and context.print.warning()', async () => {
      await runEnvCmd(mockContextInvalidSubcommandCLArgs);
      expect(mockContextInvalidSubcommandCLArgs.amplify.showHelp).toBeCalled();
      expect(mockContextInvalidSubcommandCLArgs.print.warning).toBeCalled();
    });
  });
});
