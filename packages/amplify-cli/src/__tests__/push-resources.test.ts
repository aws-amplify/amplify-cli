import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { ManuallyTimedCodePath } from '@aws-amplify/amplify-cli-core';
import { pushResources } from '../extensions/amplify-helpers/push-resources';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as $TSAny),
  FeatureFlags: {
    isInitialized: jest.fn().mockReturnValue(true),
    getNumber: jest.fn().mockResolvedValue(0),
  },
}));

jest.mock('@aws-amplify/amplify-category-custom', () => ({ generateDependentResourcesType: jest.fn() }));
// this method also returns if there are resources to be created or updated
jest.mock('../extensions/amplify-helpers/resource-status', () => ({
  showResourceTable: jest.fn().mockReturnValue(Promise.resolve(false)),
}));

const mockContext = {
  exeInfo: {
    forcePush: false,
  },
  amplify: {
    executeProviderUtils: jest.fn(),
    getResourceStatus: jest.fn().mockResolvedValue({
      resourcesToBeCreated: [],
      resourcesToBeUpdated: [],
    }),
  },
  usageData: {
    startCodePathTimer: jest.fn(),
    stopCodePathTimer: jest.fn(),
  },
  parameters: {
    options: {},
  },
} as unknown as $TSContext;

describe('push resources', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start and stop usage timer if there are no resources to push', async () => {
    await pushResources(mockContext, 'auth');
    expect(mockContext.usageData.startCodePathTimer).toBeCalledWith(ManuallyTimedCodePath.PUSH_TRANSFORM);
    expect(mockContext.usageData.stopCodePathTimer).toBeCalledWith(ManuallyTimedCodePath.PUSH_TRANSFORM);
    expect(mockContext.usageData.startCodePathTimer).toBeCalledTimes(1);
    expect(mockContext.usageData.stopCodePathTimer).toBeCalledTimes(1);
  });
});
