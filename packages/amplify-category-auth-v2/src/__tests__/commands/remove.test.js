const remove = require('../../commands/auth/remove');
const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');

describe('auth remove: ', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();
  const warningString = messages.dependenciesExists;
  const mockRemoveResource = jest.fn().mockReturnValue(Promise.resolve({}));
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';
  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getProjectDetails: mockGetProjectDetails,
      removeResource: mockRemoveResource,
    },
    print: {
      info: jest.fn(),
    },
    parameters: {
      first: 'mockFirst',
    },
  };
  const dependencies = ['analytics', 'api', 'function', 'storage'];

  it('remove run method should exist', () => {
    expect(remove.run).toBeDefined();
  });

  describe('case: resources may rely on auth', () => {
    dependencies.forEach(d => {
      beforeEach(() => {
        const amplifyMeta = {};
        amplifyMeta[d] = {};
        amplifyMeta[d].foo = 'bar';
        mockGetProjectDetails.mockReturnValue({
          projectConfig: {
            projectPath: mockProjectPath,
          },
          amplifyMeta,
        });
      });
      it(`remove method should detect existing ${d} metadata and display warning`, async () => {
        await remove.run(mockContext);
        expect(mockContext.print.info).toBeCalledWith(warningString);
      });
      it(`remove method should still be called even when warning displayed for existing ${d} resource`, async () => {
        await remove.run(mockContext);
        expect(mockContext.amplify.removeResource).toBeCalled();
      });
    });
  });

  describe('case: auth and other resources not yet enabled', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {},
      });
    });
    it('service selection prompt should be called', async () => {
      await remove.run(mockContext);
      expect(mockContext.amplify.removeResource).toBeCalled();
    });
    it('should not display a warning for existing resources', async () => {
      await remove.run(mockContext);
      expect(mockContext.print.info).not.toBeCalledWith(warningString);
    });
  });
});
