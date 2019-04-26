const fs = require('fs');
const update = require('../../commands/auth/update');
const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');

jest.mock('fs', () => ({
  readFileSync: () => '{ "Cognito": { "provider": "aws"}}',
}));

describe('auth update: ', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();
  const mockSelectionPrompt = jest.fn(() => Promise.reject(new Error()));
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';

  const mockPluginInstance = { loadResourceParameters: jest.fn() };
  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getProjectDetails: mockGetProjectDetails,
      serviceSelectionPrompt: mockSelectionPrompt,
      getPluginInstance: jest.fn().mockReturnValue(mockPluginInstance),
      readJsonFile: jest.fn(path => JSON.parse(fs.readFileSync(path))),
      pathManager: {
        getBackendDirPath: jest.fn(),
      },
    },
    print: {
      warning: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    },
  };
  const dependencies = ['analytics', 'api', 'function', 'storage'];

  it('update run method should exist', async () => {
    await expect(update.run).toBeDefined();
  });

  describe('case: auth resource does not exist', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          auth: {},
        },
      });
    });
    it('update run method should detect absence of auth resource and print a message', async () => {
      await update.run(mockContext);
      expect(mockContext.print.warning).toBeCalledWith('Auth has not yet been added to this project.');
    });
  });

  describe('case: resources may rely on auth', () => {
    dependencies.forEach((d) => {
      beforeEach(() => {
        const amplifyMeta = { auth: { foo: { bar: 'bar', Cognito: { provider: 'provider' } } } };
        amplifyMeta[d] = {};
        amplifyMeta[d].foo = 'bar';
        mockGetProjectDetails.mockReturnValue({
          projectConfig: {
            projectPath: mockProjectPath,
          },
          amplifyMeta,
        });
      });
      it(`update run method should detect presence of ${d} resource and print a message`, async () => {
        await update.run(mockContext);
        expect(mockContext.print.info).toBeCalledWith(messages.dependenciesExists);
      });
      it(`serviceSelectionPrompt should still be called even when warning displayed for existing ${d} resource`, async () => {
        await update.run(mockContext);
        expect(mockContext.amplify.serviceSelectionPrompt).toBeCalled();
      });
    });
  });

  describe('case: auth resource exists', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          auth: {
            foo: 'bar',
          },
        },
      });
    });
    it('update run method should detect presence of storage resource and print a message', async () => {
      await update.run(mockContext);
      expect(mockContext.amplify.serviceSelectionPrompt).toBeCalled();
    });
  });
});
