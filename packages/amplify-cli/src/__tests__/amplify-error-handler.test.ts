import { AmplifyError } from 'amplify-cli-core';
import { printer } from 'amplify-prompts'; // eslint-disable-line import/no-extraneous-dependencies
import { reportError } from '../commands/diagnose';
import { Context } from '../domain/context';
import { init, handleError } from '../error-handler/amplify-error-handler';

const printerMock = printer as any;

const reportErrorMock = reportError as jest.MockedFunction<typeof reportError>;
jest.mock('../commands/diagnose', () => ({
  reportError: jest.fn(async (__context: Context, __error: Error | undefined): Promise<void> => { /* no-op */ }),
}));

jest.mock('amplify-prompts');

describe('test error handler', () => {
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
    await handleError(amplifyError);

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
    await handleError(amplifyError);

    expect(reportErrorMock).toHaveBeenCalledWith(contextMock, amplifyError);
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
    await handleError(amplifyError);

    expect(printerMock.error).toHaveBeenCalledWith(amplifyError.message);
    expect(printerMock.info).toHaveBeenCalledWith(amplifyError.details);
    expect(printerMock.debug).toHaveBeenCalledWith(amplifyError.stack);
  });
});
