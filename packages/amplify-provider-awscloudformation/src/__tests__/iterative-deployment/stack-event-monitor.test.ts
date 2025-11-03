import { StackEventMonitor } from '../../iterative-deployment/stack-event-monitor';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { CloudFormationClient, DescribeStackEventsCommand } from '@aws-sdk/client-cloudformation';

const stackProgressPrinterStub = {
  printerFn: jest.fn(),
  addEventActivity: jest.fn(),
};

const mockCfnClient = mockClient(CloudFormationClient);

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'clearTimeout');

describe('StackEventMonitor', () => {
  mockCfnClient.on(DescribeStackEventsCommand).resolves({
    NextToken: undefined,
  });

  const monitor = new StackEventMonitor(
    mockCfnClient as unknown as CloudFormationClient,
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
