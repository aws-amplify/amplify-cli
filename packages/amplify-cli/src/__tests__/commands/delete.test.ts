// amplify delete run method calls process.exit() in certain situations. To avoid this affecting tests when they run, spy on process.exit()
// calls and intercept them, performing a NOP, instead.
//
// https://stackoverflow.com/questions/46148169/stubbing-process-exit-with-jest

import { UnknownArgumentError, AmplifyError } from '@aws-amplify/amplify-cli-core';

describe('amplify delete:', () => {
  const mockExit = jest.fn();
  jest.mock('@aws-amplify/amplify-cli-core', () => ({
    exitOnNextTick: mockExit,
    UnknownArgumentError,
    AmplifyError,
  }));
  const { run } = require('../../commands/delete');
  const runDeleteCmd = run;

  it('delete run method should exist', () => {
    expect(runDeleteCmd).toBeDefined();
  });

  it('delete run method should call context.amplify.deleteProject()', async () => {
    const mockContextNoCLArgs = {
      amplify: {
        deleteProject: jest.fn(),
      },
      parameters: {
        array: [],
      },
    };
    await runDeleteCmd(mockContextNoCLArgs);
    expect(mockContextNoCLArgs.amplify.deleteProject).toBeCalled();
  });

  it('delete run method should display an error message', async () => {
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
      usageData: {
        emitError: jest.fn(),
      },
    };
    await expect(runDeleteCmd(mockContextWithCLArgs)).rejects.toThrow('The "delete" command does not expect additional arguments.');
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

  it('delete run method should call context.amplify.deleteProject() when using force option', async () => {
    await runDeleteCmd(mockContextWithForceOption);
    expect(mockContextWithForceOption.amplify.deleteProject).toBeCalled();
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
    usageData: {
      emitError: jest.fn(),
    },
  };
  it('delete run method should display an error message when using force option', async () => {
    await expect(runDeleteCmd(mockContextWithForceOptionAndCLArgs)).rejects.toThrow(
      'The "delete" command does not expect additional arguments.',
    );
  });
});
