import { $TSContext, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { inAppMessagingMigrationCheck } from '../../migrations/in-app-messaging-migration';
import * as fs from 'fs-extra';

jest.mock('fs-extra');
const fsMock = fs as jest.Mocked<typeof fs>;
fsMock.existsSync.mockReturnValue(false);

jest.mock('../../utils/pinpoint-helper', () => ({
  getNotificationsCategoryHasPinpointIfExists: jest.fn().mockReturnValue(false),
  pinpointHasInAppMessagingPolicy: jest.fn().mockReturnValue(false),
}));

jest.mock('../../utils/analytics-helper', () => ({
  getAnalyticsResources: jest.fn().mockReturnValue(['mockResource']),
}));

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockDirPath'),
  },
  stateManager: {
    getMeta: jest.fn().mockReturnValue({
      analytics: {
        amplifyPlayground: {
          service: 'Kinesis',
          providerPlugin: 'awscloudformation',
        },
      },
    }),
  },
}));

describe('InAppMessagingMigration', () => {
  beforeEach(() => {
    JSONUtilities.readJson = jest.fn().mockReturnValue({});
  });

  it('should not attempt migration if analytics resource has NOT a pinpoint app', async () => {
    const mockContext = {
      amplify: {
        getProjectMeta: jest.fn(() => ({})),
      },
    };
    await inAppMessagingMigrationCheck(mockContext as unknown as $TSContext);
    expect(JSONUtilities.readJson).not.toBeCalled();
  });
});
