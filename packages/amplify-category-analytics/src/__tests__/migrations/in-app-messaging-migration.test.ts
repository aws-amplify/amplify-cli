import { $TSContext, JSONUtilities } from 'amplify-cli-core';
import { inAppMessagingMigrationCheck } from '../../migrations/in-app-messaging-migration';

jest.mock('../../utils/pinpoint-helper', () => ({
  hasResource: jest.fn().mockReturnValue(false),
  getNotificationsCategoryHasPinpointIfExists: jest.fn().mockReturnValue(false),
}));

jest.mock('../../utils/analytics-helper', () => ({
  getAnalyticsResources: jest.fn().mockReturnValue(['mockResource']),
}));

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockDirPath'),
  },
}));

describe('InAppMessagingMigration', () => {
  beforeEach(() => {
    JSONUtilities.readJson = jest.fn().mockReturnValue({});
  });

  it('should not attempt migration if there is NOT a pinpoint app', async () => {
    const mockContext = {
      amplify: {
        getProjectMeta: jest.fn(() => ({})),
      },
    };
    await inAppMessagingMigrationCheck(mockContext as unknown as $TSContext);
    expect(JSONUtilities.readJson).not.toBeCalled();
  });
});
