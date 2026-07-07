import { EOL } from 'os';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts'; // eslint-disable-line import/no-extraneous-dependencies
import { reportError } from '../commands/diagnose';
import { Context } from '../domain/context';
import { init, handleException, handleUnhandledRejection } from '../amplify-exception-handler';

const printerMock = printer as any;

const reportErrorMock = reportError as jest.MockedFunction<typeof reportError>;
jest.mock('../commands/diagnose', () => ({
  reportError: jest.fn(async (): Promise<void> => {
    /* no-op */
  }),
}));

let processExit;

jest.mock('@aws-amplify/amplify-prompts');

describe('test exception handler', () => {
  const emitErrorMock = jest.fn();
  const contextMock = {
    amplify: {},
    usageData: {
      emitError: emitErrorMock,
    },
    input: {
      options: {},
    },
  } as unknown as Context;
  beforeEach(() => {
    jest.resetAllMocks();
    processExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    init(contextMock);
  });
  it('error handler should call usageData emitError', async () => {
    const originalExitCode = process.exitCode;
    const amplifyError = new AmplifyError('NotImplementedError', {
      message: 'Test Not implemented',
      resolution: 'Test Not implemented',
    });
    await handleException(amplifyError);

    expect(contextMock.usageData.emitError).toHaveBeenCalledWith(amplifyError);
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  });

  it('error handler should send error report', async () => {
    const originalExitCode = process.exitCode;
    const amplifyError = new AmplifyError('NotImplementedError', {
      message: 'Test Not implemented',
      resolution: 'Test Not implemented',
    });
    await handleException(amplifyError);

    expect(reportErrorMock).toHaveBeenCalledWith(contextMock, amplifyError);
    expect(processExit).toHaveBeenCalledWith(1);
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  });

  it('error handler should print error', async () => {
    const originalExitCode = process.exitCode;
    const amplifyError = new AmplifyError('NotImplementedError', {
      message: 'Test Not implemented(message)',
      details: 'Test Not implemented(details)',
      resolution: 'Test Not implemented(resolution)',
    });

    await handleException(amplifyError);

    expect(printerMock.error).toHaveBeenCalledWith(`${amplifyError.message}${EOL}${amplifyError.details}`);
    expect(printerMock.info).toHaveBeenCalledTimes(2);
    expect(printerMock.info).toHaveBeenNthCalledWith(1, `Resolution: ${amplifyError.resolution}`);
    expect(printerMock.info).toHaveBeenLastCalledWith('Learn more at: https://docs.amplify.aws/cli/project/troubleshooting/');
    expect(printerMock.debug).toHaveBeenCalledWith(amplifyError.stack);
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  });

  it('error handler should handle encountered errors gracefully', async () => {
    const originalExitCode = process.exitCode;
    const amplifyError = new AmplifyError('NotImplementedError', {
      message: 'Test Not implemented(message)',
      details: 'Test Not implemented(details)',
      resolution: 'Test Not implemented(resolution)',
    });

    reportErrorMock.mockRejectedValueOnce(new Error('MockTestError'));
    await handleException(amplifyError);

    expect(printerMock.error).toHaveBeenCalledWith(`${amplifyError.message}${EOL}${amplifyError.details}`);
    expect(printerMock.info).toHaveBeenCalledTimes(2);
    expect(printerMock.info).toHaveBeenNthCalledWith(1, `Resolution: ${amplifyError.resolution}`);
    expect(printerMock.info).toHaveBeenLastCalledWith('Learn more at: https://docs.amplify.aws/cli/project/troubleshooting/');
    expect(printerMock.debug).toHaveBeenCalledWith(amplifyError.stack);
    expect(printerMock.error).toHaveBeenCalledWith('Failed to report error: MockTestError');
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  });

  it('error handler should handle nodejs file permission errors for log files', async () => {
    const originalExitCode = process.exitCode;
    const code = 'EACCES';
    const path = '/user/name/.amplify/path/to/log';
    const nodeJSError = new Error(`permission denied, open ${path}`) as NodeJS.ErrnoException;
    nodeJSError.code = code;
    nodeJSError.path = path;

    await handleException(nodeJSError);
    expect(emitErrorMock).toHaveBeenCalledTimes(1);
    expect(emitErrorMock).toHaveBeenCalledWith(
      new AmplifyError('FileSystemPermissionsError', { message: `permission denied, open ${path}` }),
    );
    expect(printerMock.info).toHaveBeenCalledWith(`Resolution: Try running 'sudo chown -R $(whoami):$(id -gn) ~/.amplify' to fix this`);
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  });

  it('error handler should handle nodejs file permission errors for ~/.aws/amplify files', async () => {
    const originalExitCode = process.exitCode;
    const code = 'EACCES';
    const path = '/user/name/.aws/amplify/someFile';
    const nodeJSError = new Error(`permission denied, open ${path}`) as NodeJS.ErrnoException;
    nodeJSError.code = code;
    nodeJSError.path = path;

    await handleException(nodeJSError);
    expect(emitErrorMock).toHaveBeenCalledTimes(1);
    expect(emitErrorMock).toHaveBeenCalledWith(
      new AmplifyError('FileSystemPermissionsError', { message: `permission denied, open ${path}` }),
    );
    expect(printerMock.info).toHaveBeenCalledWith(`Resolution: Try running 'sudo chown -R $(whoami):$(id -gn) ~/.aws/amplify' to fix this`);
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  });

  it('error handler should handle nodejs file permission errors for amplify project', async () => {
    const originalExitCode = process.exitCode;
    const code = 'EACCES';
    const path = '/user/name/workspace/amplify/path/to/manifest';
    const nodeJSError = new Error(`permission denied, open ${path}`) as NodeJS.ErrnoException;
    nodeJSError.code = code;
    nodeJSError.path = path;

    await handleException(nodeJSError);
    expect(emitErrorMock).toHaveBeenCalledTimes(1);
    expect(emitErrorMock).toHaveBeenCalledWith(
      new AmplifyError('FileSystemPermissionsError', { message: `permission denied, open ${path}` }),
    );
    // different resolution based on the file path compared to last test
    expect(printerMock.info).toHaveBeenCalledWith(
      `Resolution: Try running 'sudo chown -R $(whoami):$(id -gn) <your amplify app directory>' to fix this`,
    );
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  });

  it('error handler should handle nodejs file permission errors for other files', async () => {
    const originalExitCode = process.exitCode;
    const code = 'EACCES';
    const path = '/usr/name/.aws/config';
    const nodeJSError = new Error(`permission denied, open ${path}`) as NodeJS.ErrnoException;
    nodeJSError.code = code;
    nodeJSError.path = path;

    await handleException(nodeJSError);
    expect(emitErrorMock).toHaveBeenCalledTimes(1);
    expect(emitErrorMock).toHaveBeenCalledWith(
      new AmplifyError('FileSystemPermissionsError', { message: `permission denied, open ${path}` }),
    );
    // different resolution based on the file path compared to last test
    expect(printerMock.info).toHaveBeenCalledWith(`Resolution: Try running 'sudo chown -R $(whoami):$(id -gn) ${path}' to fix this`);
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  });
});

describe('test unhandled rejection handler', () => {
  it('should return error with message when unhandled promise rejected with string', async () => {
    const testString = 'test';
    const testError = new Error(testString);
    expect(() => {
      handleUnhandledRejection(testString);
    }).toThrowError(testError);
  });

  it('should return error with message when unhandled promise rejected with an object', async () => {
    const testObject = { error: 'test' };
    const testError = new Error(JSON.stringify(testObject));
    expect(() => {
      handleUnhandledRejection(testObject);
    }).toThrowError(testError);
  });

  it('should return error with message when unhandled promise rejected with an error', async () => {
    const testString = 'test';
    const testError = new Error(testString);
    expect(() => {
      handleUnhandledRejection(testError);
    }).toThrowError(testError);
  });

  it('should return error with message when unhandled promise rejected with a number', async () => {
    const testNumber = 1;
    const testError = new Error(testNumber.toString());
    expect(() => {
      handleUnhandledRejection(testNumber);
    }).toThrowError(testError);
  });

  it('should return error with unknown message when unhandled promise rejected with null', async () => {
    const testString = 'Unhandled promise rejection';
    const testError = new Error(testString);
    expect(() => {
      handleUnhandledRejection(null);
    }).toThrowError(testError);
  });
});
