import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { migrationCheck } from '../migrations/index';
import * as apiAnalyticsClient from '../plugin-client-api-analytics';
import { isNotificationChannelEnabled } from '../notifications-amplify-meta-api';

const mockContext = {
  input: { command: undefined },
} as unknown as $TSContext;

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  FeatureFlags: {
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
    getObject: jest.fn(),
    getString: jest.fn(),
  },
}));
jest.mock('../plugin-client-api-analytics', () => ({ invokeAnalyticsMigrations: jest.fn() }));

describe('notifications tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should properly check if notification channel is enabled', async () => {
    const notificationMeta = {
      Id: '123',
      Name: 'test',
      Region: 'us-east-1',
      ResourceName: 'test',
      service: 'Pinpoint',
      output: {},
    };

    expect(isNotificationChannelEnabled(notificationMeta, 'SMS')).toBe(false);
    notificationMeta.output = {
      SMS: {},
    };
    expect(isNotificationChannelEnabled(notificationMeta, 'SMS')).toBe(false);
    notificationMeta.output = {
      SMS: {
        Enabled: false,
      },
    };
    expect(isNotificationChannelEnabled(notificationMeta, 'SMS')).toBe(false);
    notificationMeta.output = {
      SMS: {
        Enabled: true,
      },
    };
    expect(isNotificationChannelEnabled(notificationMeta, 'SMS')).toBe(true);
  });

  test('notification migrations calls analytics migration', async () => {
    mockContext.input.command = 'add';
    await migrationCheck(mockContext);
    expect(apiAnalyticsClient.invokeAnalyticsMigrations).toBeCalled();
    jest.resetAllMocks();

    mockContext.input.command = 'configure';
    await migrationCheck(mockContext);
    expect(apiAnalyticsClient.invokeAnalyticsMigrations).toBeCalled();
    jest.resetAllMocks();

    mockContext.input.command = 'update';
    await migrationCheck(mockContext);
    expect(apiAnalyticsClient.invokeAnalyticsMigrations).toBeCalled();
    jest.resetAllMocks();

    mockContext.input.command = 'push';
    await migrationCheck(mockContext);
    expect(apiAnalyticsClient.invokeAnalyticsMigrations).toBeCalled();
    jest.resetAllMocks();

    mockContext.input.command = 'remove';
    await migrationCheck(mockContext);
    expect(apiAnalyticsClient.invokeAnalyticsMigrations).not.toBeCalled();
    jest.resetAllMocks();
  });
});
