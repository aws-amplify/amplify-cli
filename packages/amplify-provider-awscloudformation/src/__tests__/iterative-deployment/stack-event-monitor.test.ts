import { StackEventMonitor, IStackProgressPrinter } from '../../iterative-deployment/stack-event-monitor';
import { CloudFormation } from 'aws-sdk';

const stackProgressPrinterStub = ({
  print: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
} as unknown) as IStackProgressPrinter;

const cfn = ({
  describeStackEvents: () => ({
    promise: () => Promise.resolve({
      NextToken: undefined,
    }),
  }),
} as unknown) as CloudFormation;

jest.useFakeTimers();

describe('StackEventMonitor', () => {
  const monitor = new StackEventMonitor(cfn, 'testStackName', stackProgressPrinterStub);

  test('start StackEventMonitor', () => {
    monitor.start();

    jest.runAllTimers();
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
    expect(stackProgressPrinterStub.start).toBeCalled();
    setImmediate(() => {
      expect(stackProgressPrinterStub.print).toBeCalled();
    }); // print is called asynchronously by setTimeout, so we need to queue "expect" to run after all tasks are done
  });

  test('stop StackEventMonitor', () => {
    monitor.stop();

    expect(stackProgressPrinterStub.stop).toBeCalled();
    expect(stackProgressPrinterStub.print).toBeCalled();
  });
});
