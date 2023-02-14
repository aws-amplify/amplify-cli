/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('columnify');

const columnify = require('columnify');
const { times } = require('lodash');
const { initializeProgressBars } = require('../../aws-utils/aws-cfn-progress-formatter');
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
    cfn.progressBar = initializeProgressBars(eventMap);
    if (cfn.progressBar.isTTY()) {
      expect(cfn.progressBar.getBarCount()).toBe(2);
    }
    cfn.progressBar.stop();
  });

  describe('filterFailedStackEvents', () => {
    test('that it does not filter stack events that are in eventToCategories map', async () => {
      const eventsWithFailure = [
        {
          StackId: 'testStackId1',
          LogicalResourceId: 'testLogicalResourceId1',
          ResourceType: 'AWS::IAM::Role',
          ResourceStatusReason: 'Some valid reason',
        },
        {
          StackId: 'testStackId2',
          LogicalResourceId: 'testLogicalResourceId2',
          ResourceType: 'AWS::IAM::Role',
          ResourceStatusReason: 'Some valid reason',
        },
      ];

      const eventMap = {
        rootResources: [],
        eventToCategories: new Map(),
        categories: [],
      };
      // Only testLogicalResourceId1 is in the eventToCategories Map
      eventMap.eventToCategories.set('testLogicalResourceId1', 'testLogicalResourceId1-value');
      const cfn = await new CloudFormation();
      cfn.eventMap = eventMap;
      const filteredEvents = cfn.filterFailedStackEvents(eventsWithFailure);

      // Only testStackId1 event should be returned since that's the only one in eventToCategories map
      expect(filteredEvents).toEqual(eventsWithFailure.filter(e => e.StackId == 'testStackId1'));
    });

    test('that it filters stack events with cascade failure reasons', async () => {
      const eventsWithFailure = [
        {
          StackId: 'testStackId1',
          LogicalResourceId: 'testLogicalResourceId1',
          ResourceType: 'AWS::IAM::Role',
          ResourceStatusReason: 'Resource creation cancelled',
        },
      ];

      const eventMap = {
        rootResources: [],
        eventToCategories: new Map(),
        categories: [],
      };
      eventMap.eventToCategories.set('testLogicalResourceId1', 'testLogicalResourceId1-value');
      const cfn = await new CloudFormation();
      cfn.eventMap = eventMap;
      const filteredEvents = cfn.filterFailedStackEvents(eventsWithFailure);
      expect(filteredEvents).toEqual([]); // empty array
    });

    test('that it only filters resource of type AWS::CloudFormation::Stack with generic error message', async () => {
      const eventsWithFailure = [
        {
          StackId: 'testStackId1',
          LogicalResourceId: 'testLogicalResourceId1',
          ResourceType: 'AWS::CloudFormation::Stack',
          ResourceStatusReason: 'The following resource(s) failed to create: [LambdaExecutionRole]. ',
        },
        {
          StackId: 'testStackId2',
          LogicalResourceId: 'testLogicalResourceId2',
          ResourceType: 'AWS::CloudFormation::Stack',
          ResourceStatusReason: 'Some valid stack failure message',
        },
      ];

      const eventMap = {
        rootResources: [
          {
            category: 'resourceCategory1',
            key: 'testLogicalResourceId1',
          },
          {
            category: 'resourceCategory2',
            key: 'testLogicalResourceId2',
          },
        ],
        categories: [],
      };
      const cfn = await new CloudFormation();
      cfn.eventMap = eventMap;
      const filteredEvents = cfn.filterFailedStackEvents(eventsWithFailure);

      // Should not filter testStackId1 event that has a specific error message
      expect(filteredEvents).toEqual(eventsWithFailure.filter(e => e.StackId == 'testStackId2'));
    });
  });
});
