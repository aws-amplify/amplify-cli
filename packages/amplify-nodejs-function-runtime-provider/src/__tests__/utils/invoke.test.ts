import * as execa from 'execa';
import { invoke } from '../../utils/invoke';
import { InvokeOptions } from '../../utils/invokeOptions';

jest.mock('execa');
const execa_mock = execa as jest.Mocked<typeof execa>;

class ExecaChildProcessMock {
  public stdout = {
    on: jest.fn(),
  };
  public on = jest.fn();
  public catch = jest.fn();
  public send = jest.fn();
}
const defaultOptions: InvokeOptions = {
  event: 'some event',
  handler: 'some handler',
  packageFolder: '.',
};

const findEvent = (eventName: string, calls: any[]) => {
  return calls.find(call => call[0] == eventName);
};

const callCb = (eventNamel: string, data: any, mocked: jest.Mock) => {
  const dataCallback = findEvent(eventNamel, mocked.mock.calls)[1];
  dataCallback(data);
};

const EXIT_ERROR = new Error('process finishs with 1');
const exitWithError = (mocked: ExecaChildProcessMock) => {
  mocked.catch.mock.calls[0][0](EXIT_ERROR);
};

describe('invoke', () => {
  describe('close event happens before exit', () => {
    it('should succeed', async () => {
      const mockInstance = new ExecaChildProcessMock();
      execa_mock.node.mockImplementation(file => mockInstance as any);
      const promise = invoke(defaultOptions);
      callCb('data', '\n', mockInstance.stdout.on);
      callCb(
        'data',
        JSON.stringify({
          result: { attribute: 1 },
        }),
        mockInstance.stdout.on,
      );

      //Closes happens before exit
      callCb('close', undefined, mockInstance.on);
      exitWithError(mockInstance);

      await expect(promise).resolves.toEqual({ attribute: 1 });
    });
  });

  describe('close event happens after exit', () => {
    it('should succeed', async () => {
      const mockInstance = new ExecaChildProcessMock();
      execa_mock.node.mockImplementation(file => mockInstance as any);
      const promise = invoke(defaultOptions);
      callCb('data', '\n', mockInstance.stdout.on);
      callCb(
        'data',
        JSON.stringify({
          result: { attribute: 1 },
        }),
        mockInstance.stdout.on,
      );

      //Closes happens before exit
      exitWithError(mockInstance);
      callCb('close', undefined, mockInstance.on);

      await expect(promise).resolves.toEqual({ attribute: 1 });
    });
  });

  describe('close event happens up to 2 seconds after exit', () => {
    it('should succeed', async () => {
      const mockInstance = new ExecaChildProcessMock();
      execa_mock.node.mockImplementation(file => mockInstance as any);
      const promise = invoke(defaultOptions);
      callCb('data', '\n', mockInstance.stdout.on);
      callCb(
        'data',
        JSON.stringify({
          result: { attribute: 1 },
        }),
        mockInstance.stdout.on,
      );

      //Closes happens before exit
      exitWithError(mockInstance);
      setTimeout(() => {
        callCb('close', undefined, mockInstance.on);
      }, 1800);

      await expect(promise).resolves.toEqual({ attribute: 1 });
    });

    it('should reject with error body', async () => {
      const mockInstance = new ExecaChildProcessMock();
      execa_mock.node.mockImplementation(file => mockInstance as any);
      const promise = invoke(defaultOptions);
      callCb('data', '\n', mockInstance.stdout.on);
      callCb(
        'data',
        JSON.stringify({
          error: 'some error',
        }),
        mockInstance.stdout.on,
      );

      //Closes happens before exit
      exitWithError(mockInstance);
      setTimeout(() => {
        callCb('close', undefined, mockInstance.on);
      }, 500);

      await expect(promise).rejects.toEqual('some error');
    });
  });

  describe('close event happens after 2 seconds after exit', () => {
    it('should reject', async () => {
      const mockInstance = new ExecaChildProcessMock();
      execa_mock.node.mockImplementation(file => mockInstance as any);
      const promise = invoke(defaultOptions);
      callCb('data', '\n', mockInstance.stdout.on);
      callCb(
        'data',
        JSON.stringify({
          result: { attribute: 1 },
        }),
        mockInstance.stdout.on,
      );

      //Closes happens before exit
      exitWithError(mockInstance);
      setTimeout(() => {
        callCb('close', undefined, mockInstance.on);
      }, 2800);

      await expect(promise).rejects.not.toBeNull();
    });
  });

  describe('body with error', () => {
    it('should reject', async () => {
      const mockInstance = new ExecaChildProcessMock();
      execa_mock.node.mockImplementation(file => mockInstance as any);
      const promise = invoke(defaultOptions);
      callCb('data', '\n', mockInstance.stdout.on);
      callCb(
        'data',
        JSON.stringify({
          error: { message: 'some error' },
        }),
        mockInstance.stdout.on,
      );

      //Closes happens before exit
      exitWithError(mockInstance);
      callCb('close', undefined, mockInstance.on);

      await expect(promise).rejects.toEqual({
        message: 'some error',
      });
    });
  });

  describe('without data', () => {
    it('should reject', async () => {
      const mockInstance = new ExecaChildProcessMock();
      execa_mock.node.mockImplementation(file => mockInstance as any);
      const promise = invoke(defaultOptions);
      //Closes happens before exit
      exitWithError(mockInstance);
      callCb('close', undefined, mockInstance.on);

      await expect(promise).rejects.toEqual(EXIT_ERROR.message);
    });
  });

  describe('body with invalid JSON', () => {
    it('should reject', async () => {
      const mockInstance = new ExecaChildProcessMock();
      execa_mock.node.mockImplementation(file => mockInstance as any);
      const promise = invoke(defaultOptions);
      const invalidJson = 'Invalid Json {[';

      callCb('data', '\n', mockInstance.stdout.on);
      callCb('data', invalidJson, mockInstance.stdout.on);

      //Closes happens before exit
      exitWithError(mockInstance);
      callCb('close', undefined, mockInstance.on);

      await expect(promise).resolves.toEqual(invalidJson);
    });
  });

  describe('unexpected throw', () => {
    it('should reject', async () => {
      const error = new Error('unexpected error');
      execa_mock.node.mockImplementation(file => {
        throw error;
      });
      const promise = invoke(defaultOptions);
      await expect(promise).rejects.toEqual(error);
    });
  });
});
