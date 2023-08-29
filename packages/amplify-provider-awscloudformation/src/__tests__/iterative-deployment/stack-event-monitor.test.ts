import type { CloudFormation } from 'aws-sdk';
import { StackEventMonitor } from '../../iterative-deployment/stack-event-monitor';

const stackProgressPrinterStub = {
  printerFn: jest.fn(),
  addEventActivity: jest.fn(),
};

const cfn = {
  describeStackEvents: () => ({
    promise: () =>
      Promise.resolve({
        NextToken: undefined,
      }),
  }),
} as unknown as CloudFormation;

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'clearTimeout');

describe('StackEventMonitor', () => {
  const monitor = new StackEventMonitor(
    cfn,
    'testStackName',
    stackProgressPrinterStub.printerFn,
    stackProgressPrinterStub.addEventActivity,
  );

  test('start StackEventMonitor', () => {
    monitor.start();

    jest.runAllTimers();
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
    setImmediate(() => {
      expect(stackProgressPrinterStub.printerFn).toBeCalled();
      expect(stackProgressPrinterStub.addEventActivity).not.toBeCalled();
    });
  });

  test('stop StackEventMonitor', async () => {
    await monitor.stop();

    expect(stackProgressPrinterStub.printerFn).toBeCalled();
    expect(clearTimeout).toBeCalledTimes(1);
  });
});
