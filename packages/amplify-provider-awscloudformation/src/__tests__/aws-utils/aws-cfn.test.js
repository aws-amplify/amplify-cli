/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('columnify');

const columnify = require('columnify');
const { times } = require('lodash');
const CloudFormation = require('../../aws-utils/aws-cfn');

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
    const timestamps = columnify.mock.calls[0][0];
    expect(timestamps.map(obj => Object.keys(obj))).toMatchInlineSnapshot(`
      Array [
        Array [
          "Timestamp",
        ],
        Array [
          "Timestamp",
        ],
      ]
    `);
    expect(columnify.mock.calls[0][1]).toEqual(columns);
  });

  test('Initialize progress bars should create the current number of progress bars as eventMap', async () => {
    const eventMap = {
      projectName: 'test',
      envName: 'dev',
      rootStackName: 'root-app',
      rootResources: ['test-app'],
      categories: [],
    };
    const cfn = await new CloudFormation();
    cfn.eventMap = eventMap;
    cfn.progressBar = cfn.initializeProgressBars();
    expect(cfn.progressBar.getBarCount()).toBe(2);
    cfn.progressBar.stop();
  });
});
