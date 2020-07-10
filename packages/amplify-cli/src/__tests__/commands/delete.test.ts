import { run as runDeleteCmd } from '../../commands/delete';

// amplify delete run method calls process.exit() in certain situations. To avoid this affecting tests when they run, spy on process.exit()
// calls and intercept them, performing a NOP, instead.
//
// https://stackoverflow.com/questions/46148169/stubbing-process-exit-with-jest
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('amplify delete: ', () => {
  it('delete run method should exist', () => {
    expect(runDeleteCmd).toBeDefined();
  });

  const mockContextNoCLArgs = {
    amplify: {
      deleteProject: jest.fn(),
    },
    parameters: {
      array: [],
    },
  };

  describe('case: amplify delete is run with no additional command line arguments', () => {
    it('delete run method should call context.amplify.deleteProject()', async () => {
      await runDeleteCmd(mockContextNoCLArgs);
      expect(mockContextNoCLArgs.amplify.deleteProject).toBeCalled();
    });
  });

  const mockContextWithCLArgs = {
    amplify: {
      deleteProject: jest.fn(),
    },
    parameters: {
      array: ['foo'],
    },
    print: {
      error: jest.fn(),
    },
  };

  describe('case: amplify delete is run with additional command line arguments', () => {
    it('delete run method should display an error message', async () => {
      await runDeleteCmd(mockContextWithCLArgs);
      expect(mockContextWithCLArgs.print.error).toBeCalledWith('"delete" command does not expect additional arguments.');
      expect(mockContextWithCLArgs.print.error).toBeCalledWith('Perhaps you meant to use the "remove" command instead of "delete"?');
      expect(mockExit).toBeCalledWith(1);
    });
  });

  const mockContextWithForceOption = {
    amplify: {
      deleteProject: jest.fn(),
    },
    parameters: {
      array: [],
    },
    options: {
      force: true,
    },
  };

  describe('case: amplify delete is run with the --force command line option', () => {
    it('delete run method should call context.amplify.deleteProject()', async () => {
      await runDeleteCmd(mockContextWithForceOption);
      expect(mockContextWithForceOption.amplify.deleteProject).toBeCalled();
    });
  });

  const mockContextWithForceOptionAndCLArgs = {
    amplify: {
      deleteProject: jest.fn(),
    },
    parameters: {
      array: ['foo'],
    },
    options: {
      force: true,
    },
    print: {
      error: jest.fn(),
    },
  };

  describe('case: amplify delete is run with the --force command line option, as well as additional command line arguments', () => {
    it('delete run method should display an error message', async () => {
      console.log('did we run?');
      await runDeleteCmd(mockContextWithForceOptionAndCLArgs);
      expect(mockContextWithForceOptionAndCLArgs.print.error).toBeCalledWith('"delete" command does not expect additional arguments.');
      expect(mockContextWithForceOptionAndCLArgs.print.error).toBeCalledWith(
        'Perhaps you meant to use the "remove" command instead of "delete"?',
      );
      expect(mockExit).toBeCalledWith(1);
    });
  });
});
