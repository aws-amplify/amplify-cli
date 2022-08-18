import { StackEventMonitor, IStackProgressPrinter } from '../../iterative-deployment/stack-event-monitor';
import { CloudFormation } from 'aws-sdk';

const stackProgressPrinterStub = {
  printerFn: jest.fn(),
  addEventActivity: jest.fn(),
};

const cfn = ({
  describeStackEvents: () => ({
    promise: () => Promise.resolve({
      NextToken: undefined,
    }),
  }),
} as unknown) as CloudFormation;

jest.useFakeTimers();

describe('StackEventMonitor', () => {
  const monitor = new StackEventMonitor(cfn, 'testStackName',
    stackProgressPrinterStub.printerFn, stackProgressPrinterStub.addEventActivity);

  test('start StackEventMonitor', () => {
    monitor.start();

    jest.runAllTimers();
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 5000);
  });

  test('stop StackEventMonitor', () => {
    monitor.stop();

    expect(stackProgressPrinterStub.printerFn).toBeCalled();
  });
});
