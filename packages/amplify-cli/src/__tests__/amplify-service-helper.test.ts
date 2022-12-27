import { $TSContext, stateManager, pathManager } from 'amplify-cli-core';
import { postPullCodegen } from '../amplify-service-helper';
import { getResourceStatus } from '../extensions/amplify-helpers/resource-status';
import { isDataStoreEnabled } from 'graphql-transformer-core';

jest.mock('amplify-cli-core');
jest.mock('graphql-transformer-core', () => ({
  isDataStoreEnabled: jest.fn(() => true),
}));
jest.mock('../extensions/amplify-helpers/resource-status', () => ({
  getResourceStatus: jest.fn(() => ({
    resourcesToBeCreated: [],
    resourcesToBeUpdated: [],
    resourcesToBeSynced: [],
    resourcesToBeDeleted: [],
  })),
}));

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;

stateManagerMock.getCurrentMeta.mockReturnValue({
  api: {
    foo: {
      service: 'AppSync',
    },
  },
});

pathManagerMock.getBackendDirPath.mockReturnValue('foo');

describe('amplify-service-helper', () => {
  describe('post-pull-codegen', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('runs codegen when there are changes to api', async () => {
      (getResourceStatus as jest.Mock).mockReturnValueOnce({
        resourcesToBeCreated: [],
        resourcesToBeUpdated: ['foo'],
        resourcesToBeSynced: [],
        resourcesToBeDeleted: [],
      });
      const invokePluginMethod = jest.fn();
      const contextStub = {
        amplify: {
          invokePluginMethod,
        },
      } as unknown as $TSContext;
      await postPullCodegen(contextStub);
      expect(invokePluginMethod).toHaveBeenCalledWith(contextStub, 'codegen', undefined, 'generateModels', [contextStub]);
      expect(invokePluginMethod).toHaveBeenCalledTimes(2); // invokePluginMethod is still called for ui components
    });

    it('does not run codegen when there are no changes to api', async () => {
      (getResourceStatus as jest.Mock).mockReturnValue({
        resourcesToBeCreated: [],
        resourcesToBeUpdated: [],
        resourcesToBeSynced: [],
        resourcesToBeDeleted: [],
      });
      const invokePluginMethod = jest.fn();
      const contextStub = {
        amplify: {
          invokePluginMethod,
        },
      } as unknown as $TSContext;
      await postPullCodegen(contextStub);

      expect(invokePluginMethod).toHaveBeenCalledWith(contextStub, 'ui-builder', undefined, 'executeAmplifyCommand', [
        contextStub,
        'generateComponents',
      ]);
      expect(invokePluginMethod).toHaveBeenCalledTimes(1); // invokePluginMethod is still called for ui components
    });
  });
});
