import { StackProgressPrinter } from '../../iterative-deployment/stack-progress-printer';
import { IStackProgressPrinter } from '../../iterative-deployment/stack-event-monitor';
import columnify from 'columnify';

const printer: IStackProgressPrinter = new StackProgressPrinter();
jest.mock('columnify');

describe('StackProgressPrinter', () => {
  test('print events order by Timestamp', () => {
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
  });
});
