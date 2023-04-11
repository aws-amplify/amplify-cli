import { $TSContext, FeatureFlags, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import {
  notifyFieldAuthSecurityChange,
  notifyListQuerySecurityChange,
  notifySecurityEnhancement,
} from '../extensions/amplify-helpers/auth-notifications';

jest.mock('@aws-amplify/amplify-cli-core');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
// eslint-disable-next-line spellcheck/spell-checker
stateManagerMock.getCLIJSON.mockReturnValue({ features: { graphqltransformer: {} } });

const contextMock = {
  amplify: {},
  parameters: {
    first: 'resourceName',
  },
} as unknown as $TSContext;

describe('push notifications', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('notifyFieldAuthSecurityChange should exit without fail when there is not api resource directory', async () => {
    (<any>FeatureFlags.getBoolean).mockReturnValue(true);
    (<any>pathManager.getResourceDirectoryPath).mockReturnValue('path-to-non-existing-resource-directory');
    (<any>stateManager.getMeta).mockReturnValue({
      api: {
        'test-api-dev': {
          service: 'AppSync',
          output: {
            name: 'test-api-dev',
          },
        },
      },
    });
    (<any>FeatureFlags.ensureFeatureFlag).mockImplementation(() => {
      /* noop */
    });
    await notifyFieldAuthSecurityChange(contextMock);
    // eslint-disable-next-line spellcheck/spell-checker
    expect(<any>FeatureFlags.ensureFeatureFlag).toHaveBeenCalledWith('graphqltransformer', 'showFieldAuthNotification');
  });

  it('notifyListQuerySecurityChange should exit without fail when there is not api resource directory', async () => {
    (<any>pathManager.getResourceDirectoryPath).mockReturnValue('path-to-non-existing-resource-directory');
    (<any>stateManager.getMeta).mockReturnValue({
      api: {
        'test-api-dev': {
          service: 'AppSync',
          output: {
            name: 'test-api-dev',
          },
        },
      },
    });
    (<any>FeatureFlags.ensureFeatureFlag).mockImplementation(() => {
      /* noop */
    });
    await notifyListQuerySecurityChange(contextMock);
  });

  it('notifySecurityEnhancement should exit without fail when there is not api resource directory', async () => {
    (<any>FeatureFlags.getBoolean).mockReturnValue(true);
    (<any>pathManager.getResourceDirectoryPath).mockReturnValue('path-to-non-existing-resource-directory');
    (<any>stateManager.getMeta).mockReturnValue({
      api: {
        'test-api-dev': {
          service: 'AppSync',
          output: {
            name: 'test-api-dev',
          },
        },
      },
    });
    (<any>FeatureFlags.ensureFeatureFlag).mockImplementation(() => {
      /* noop */
    });
    await notifySecurityEnhancement(contextMock);
    // eslint-disable-next-line spellcheck/spell-checker
    expect(<any>FeatureFlags.ensureFeatureFlag).toHaveBeenCalledWith('graphqltransformer', 'securityEnhancementNotification');
  });
});
