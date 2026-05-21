import { AwsFetcher } from '../../../../../commands/gen2-migration/_common/aws-fetcher';
import { AwsClients } from '../../../../../commands/gen2-migration/_common/aws-clients';

function createMockClients(overrides: { lambdaSend?: jest.Mock; cloudWatchEventsSend?: jest.Mock }): AwsClients {
  return {
    lambda: { send: overrides.lambdaSend ?? jest.fn() },
    cloudWatchEvents: { send: overrides.cloudWatchEventsSend ?? jest.fn() },
  } as unknown as AwsClients;
}

describe('AwsFetcher', () => {
  describe('fetchFunctionSchedule()', () => {
    it('returns the schedule expression when the rule exists', async () => {
      const policy = {
        Statement: [
          {
            Condition: {
              ArnLike: {
                'AWS:SourceArn': 'arn:aws:events:us-east-1:123456789:rule/myFunc-schedule',
              },
            },
          },
        ],
      };
      const lambdaSend = jest.fn().mockResolvedValue({ Policy: JSON.stringify(policy) });
      const cloudWatchEventsSend = jest.fn().mockResolvedValue({ ScheduleExpression: 'rate(1 hour)' });

      const fetcher = new AwsFetcher(createMockClients({ lambdaSend, cloudWatchEventsSend }));
      const result = await fetcher.fetchFunctionSchedule('myFunc');

      expect(result).toBe('rate(1 hour)');
    });

    it('returns undefined when GetPolicy throws ResourceNotFoundException', async () => {
      const error = new Error('Resource not found');
      error.name = 'ResourceNotFoundException';
      const lambdaSend = jest.fn().mockRejectedValue(error);

      const fetcher = new AwsFetcher(createMockClients({ lambdaSend }));
      const result = await fetcher.fetchFunctionSchedule('myFunc');

      expect(result).toBeUndefined();
    });

    it('returns undefined when DescribeRule throws ResourceNotFoundException', async () => {
      const policy = {
        Statement: [
          {
            Condition: {
              ArnLike: {
                'AWS:SourceArn': 'arn:aws:events:us-east-1:123456789:rule/myFunc-schedule',
              },
            },
          },
        ],
      };
      const lambdaSend = jest.fn().mockResolvedValue({ Policy: JSON.stringify(policy) });
      const error = new Error('Rule myFunc-schedule does not exist on EventBus default.');
      error.name = 'ResourceNotFoundException';
      const cloudWatchEventsSend = jest.fn().mockRejectedValue(error);

      const fetcher = new AwsFetcher(createMockClients({ lambdaSend, cloudWatchEventsSend }));
      const result = await fetcher.fetchFunctionSchedule('myFunc');

      expect(result).toBeUndefined();
    });

    it('propagates non-ResourceNotFoundException errors from GetPolicy', async () => {
      const error = new Error('Access denied');
      error.name = 'AccessDeniedException';
      const lambdaSend = jest.fn().mockRejectedValue(error);

      const fetcher = new AwsFetcher(createMockClients({ lambdaSend }));

      await expect(fetcher.fetchFunctionSchedule('myFunc')).rejects.toThrow('Access denied');
    });

    it('propagates non-ResourceNotFoundException errors from DescribeRule', async () => {
      const policy = {
        Statement: [
          {
            Condition: {
              ArnLike: {
                'AWS:SourceArn': 'arn:aws:events:us-east-1:123456789:rule/myFunc-schedule',
              },
            },
          },
        ],
      };
      const lambdaSend = jest.fn().mockResolvedValue({ Policy: JSON.stringify(policy) });
      const error = new Error('Internal failure');
      error.name = 'InternalException';
      const cloudWatchEventsSend = jest.fn().mockRejectedValue(error);

      const fetcher = new AwsFetcher(createMockClients({ lambdaSend, cloudWatchEventsSend }));

      await expect(fetcher.fetchFunctionSchedule('myFunc')).rejects.toThrow('Internal failure');
    });

    it('returns undefined when the policy has no schedule rule reference', async () => {
      const policy = {
        Statement: [
          {
            Condition: {
              ArnLike: {
                'AWS:SourceArn': 'arn:aws:execute-api:us-east-1:123456789:abc/*/GET/',
              },
            },
          },
        ],
      };
      const lambdaSend = jest.fn().mockResolvedValue({ Policy: JSON.stringify(policy) });

      const fetcher = new AwsFetcher(createMockClients({ lambdaSend }));
      const result = await fetcher.fetchFunctionSchedule('myFunc');

      expect(result).toBeUndefined();
    });

    it('returns undefined when the policy response has no Policy field', async () => {
      const lambdaSend = jest.fn().mockResolvedValue({});

      const fetcher = new AwsFetcher(createMockClients({ lambdaSend }));
      const result = await fetcher.fetchFunctionSchedule('myFunc');

      expect(result).toBeUndefined();
    });
  });
});
