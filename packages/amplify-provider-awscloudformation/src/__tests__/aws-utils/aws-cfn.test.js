jest.mock('columnify');

const CloudFormation = require('../../aws-utils/aws-cfn');
const columnify = require('columnify');

describe('CloudFormation', () => {
  test('showNewEvents shows events order by Timestamp', async () => {
    const cfn = await new CloudFormation();
    const events = [
      {
        StackId: 'test',
        EventId: 'test1',
        StackName: 'test',
        Timestamp: new Date('2021-01-01'),
      },
      {
        StackId: 'test',
        EventId: 'test2',
        StackName: 'test',
        Timestamp: new Date('2020-01-01'),
      },
    ];
    cfn.showNewEvents(events);
    const columns = {
      columns: ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'],
      showHeaders: false,
    };
    expect(columnify).toBeCalledTimes(1);
    expect(columnify.mock.calls[0][0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "Timestamp": "[0mTue Dec 31 2019 16:00:00 GMT-0800 (Pacific Standard Time)[0m",
        },
        Object {
          "Timestamp": "[0mThu Dec 31 2020 16:00:00 GMT-0800 (Pacific Standard Time)[0m",
        },
      ]
    `);
    expect(columnify.mock.calls[0][1]).toEqual(columns);
  });
});
