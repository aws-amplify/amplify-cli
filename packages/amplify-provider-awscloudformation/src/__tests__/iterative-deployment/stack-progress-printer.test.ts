import { MultiProgressBar } from '@aws-amplify/amplify-prompts';
import columnify from 'columnify';
import { StackProgressPrinter } from '../../iterative-deployment/stack-progress-printer';
import { IStackProgressPrinter } from '../../iterative-deployment/stack-event-monitor';

// Make sure that chalk colors are stripped for the test.
function chalkMock(input) {
  if (input instanceof Date) {
    return input.toString();
  }

  return input;
}

jest.mock('chalk', () => ({
  green: jest.fn().mockImplementation(chalkMock),
  red: jest.fn().mockImplementation(chalkMock),
  reset: jest.fn().mockImplementation(chalkMock),
}));

jest.mock('columnify');

describe('StackProgressPrinter', () => {
  const eventMap = {
    projectName: 'test',
    envName: 'dev',
    rootStackName: 'root-app',
    rootResources: [{ key: 'test-app', category: 'api' }],
    categories: [{ name: 'api', size: 2 }],
    eventToCategories: new Map(),
  };

  const isTTYMock = jest.spyOn(MultiProgressBar.prototype, 'isTTY');

  const printer: IStackProgressPrinter = new StackProgressPrinter(eventMap);

  afterEach(() => {
    printer.stopBars();
    printer.finishBars();
    jest.clearAllMocks();
  });

  test('update events ordered by timestamp in TTY', () => {
    isTTYMock.mockReturnValue(true);

    printer.addActivity({
      StackId: 'test',
      EventId: 'test',
      StackName: 'test',
      Timestamp: new Date('2021-01-01'),
    });
    printer.addActivity({
      StackId: 'test',
      EventId: 'test',
      StackName: 'test',
      Timestamp: new Date('2020-01-01'),
    });
    printer.print();
    expect(columnify).not.toBeCalled();
    expect(isTTYMock).toBeCalledTimes(3);
  });

  test('print events ordered by timestamp in non-TTY', () => {
    isTTYMock.mockReturnValue(false);

    printer.addActivity({
      StackId: 'test',
      EventId: 'test',
      StackName: 'test',
      Timestamp: new Date('2021-01-01'),
    });
    printer.addActivity({
      StackId: 'test',
      EventId: 'test',
      StackName: 'test',
      Timestamp: new Date('2020-01-01'),
    });
    printer.print();
    const times = [{ Timestamp: new Date('2020-01-01').toString() }, { Timestamp: new Date('2021-01-01').toString() }];
    const columns = {
      columns: ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'],
      showHeaders: false,
    };
    expect(columnify).toBeCalledWith(times, columns);
    expect(isTTYMock).toBeCalledTimes(3);
  });
});
