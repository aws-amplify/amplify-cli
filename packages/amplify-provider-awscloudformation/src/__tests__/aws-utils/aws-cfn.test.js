const { CloudFormation } = require('../../aws-utils/aws-cfn');
const columnify = require('columnify');

jest.mock('columnify');
const cfn = new CloudFormation();

describe('CloudFormation', () => {
  test('showNewEvents shows events order by Timestamp', () => {
    const events = [
      {
        StackId: 'test',
        EventId: 'test',
        StackName: 'test',
        Timestamp: new Date('2021-01-01'),
      },
      {
        StackId: 'test',
        EventId: 'test',
        StackName: 'test',
        Timestamp: new Date('2020-01-01'),
      },
    ];
    cfn.showNewEvents(events);
    const times = [{ Timestamp: new Date('2020-01-01').toString() }, { Timestamp: new Date('2021-01-01').toString() }];
    const columns = {
      columns: ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'],
      showHeaders: false,
    };
    expect(columnify).toBeCalledWith(times, columns);
  });
});
