import { $TSContext } from 'amplify-cli-core';
import { migrationCheck } from '../migrations/index';
import * as apiAnalyticsClient from '../plugin-client-api-analytics';

const mockContext = {
  input: { command: undefined },
} as unknown as $TSContext;

jest.mock('../plugin-client-api-analytics', () => ({ invokeAnalyticsMigrations: jest.fn() }));

describe('notifications tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
