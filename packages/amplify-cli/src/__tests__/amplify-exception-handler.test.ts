import { AmplifyError } from 'amplify-cli-core';
import { printer } from 'amplify-prompts'; // eslint-disable-line import/no-extraneous-dependencies
import { reportError } from '../commands/diagnose';
import { Context } from '../domain/context';
import { init, handleException, handleUnhandledRejection } from '../amplify-exception-handler';

const printerMock = printer as any;

const reportErrorMock = reportError as jest.MockedFunction<typeof reportError>;
jest.mock('../commands/diagnose', () => ({
  reportError: jest.fn(async (__context: Context, __error: Error | undefined): Promise<void> => { /* no-op */ }),
}));

const processExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((__code?: number) => undefined as never);

jest.mock('amplify-prompts');

describe('test exception handler', () => {
  it('error handler should call usageData emitError', async () => {
    const amplifyError = new AmplifyError('NotImplementedError', {
      message: 'Test Not implemented',
      resolution: 'Test Not implemented',
    });
    const contextMock = {
      amplify: {},
      usageData: {
        emitError: jest.fn(),
      },
      input: {
        options: {},
      },
    } as unknown as Context;

    init(contextMock);
    await handleException(amplifyError);

    expect(contextMock.usageData.emitError).toHaveBeenCalledWith(amplifyError);
  });

  it('error handler should send error report', async () => {
    const amplifyError = new AmplifyError('NotImplementedError', {
      message: 'Test Not implemented',
      resolution: 'Test Not implemented',
    });
    const contextMock = {
      amplify: {},
      usageData: {
        emitError: jest.fn(),
      },
      input: {
        options: {},
      },
    } as unknown as Context;

    init(contextMock);
    await handleException(amplifyError);

    expect(reportErrorMock).toHaveBeenCalledWith(contextMock, amplifyError);
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it('error handler should print error', async () => {
    const amplifyError = new AmplifyError('NotImplementedError', {
      message: 'Test Not implemented',
      details: 'Test Not implemented',
      resolution: 'Test Not implemented',
    });
    const contextMock = {
      amplify: {},
      usageData: {
        emitError: jest.fn(),
      },
      input: {
        options: {},
      },
    } as unknown as Context;

    init(contextMock);
    await handleException(amplifyError);

    expect(printerMock.error).toHaveBeenCalledWith(amplifyError.message);
    expect(printerMock.info).toHaveBeenCalledWith(amplifyError.details);
    expect(printerMock.debug).toHaveBeenCalledWith(amplifyError.stack);
  });

  it('error handler should handle encountered errors gracefully', async () => {
    const amplifyError = new AmplifyError('NotImplementedError', {
      message: 'Test Not implemented',
      details: 'Test Not implemented',
      resolution: 'Test Not implemented',
    });
    const contextMock = {
      amplify: {},
      usageData: {
        emitError: jest.fn(),
      },
      input: {
        options: {},
      },
    } as unknown as Context;

    init(contextMock);
    reportErrorMock.mockRejectedValueOnce(new Error('MockTestError'));
    await handleException(amplifyError);

    expect(printerMock.error).toHaveBeenCalledWith(amplifyError.message);
    expect(printerMock.info).toHaveBeenCalledWith(amplifyError.details);
    expect(printerMock.debug).toHaveBeenCalledWith(amplifyError.stack);
    expect(printerMock.error).toHaveBeenCalledWith('Failed to report error: MockTestError');
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
