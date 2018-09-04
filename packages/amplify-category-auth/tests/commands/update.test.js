const update = require('../../commands/auth/update');
const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');

jest.mock('fs', () => ({
  readFileSync: () => '{}',
}));

describe('auth update: ', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();
  const mockSelectionPrompt = jest.fn(() => Promise.reject(new Error()));
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';
  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getProjectDetails: mockGetProjectDetails,
      serviceSelectionPrompt: mockSelectionPrompt,
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

  it('update run method should exist', () => {
    expect(update.run).toBeDefined();
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
    it('update run method should detect absence of auth resource and print a message', () => {
      update.run(mockContext);
      expect(mockContext.print.warning).toBeCalledWith('Auth has not yet been added to this project.');
    });
  });

  describe('case: resources may rely on auth', () => {
    dependencies.forEach((d) => {
      beforeEach(() => {
        const amplifyMeta = { auth: { foo: 'bar' } };
        amplifyMeta[d] = {};
        amplifyMeta[d].foo = 'bar';
        mockGetProjectDetails.mockReturnValue({
          projectConfig: {
            projectPath: mockProjectPath,
          },
          amplifyMeta,
        });
      });
      it(`update run method should detect presence of ${d} resource and print a message`, () => {
        update.run(mockContext);
        expect(mockContext.print.info).toBeCalledWith(messages.dependenciesExists);
      });
      it(`serviceSelectionPrompt should still be called even when warning displayed for existing ${d} resource`, () => {
        update.run(mockContext);
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
    it('update run method should detect presence of storage resource and print a message', () => {
      update.run(mockContext);
      expect(mockContext.amplify.serviceSelectionPrompt).toBeCalled();
    });
  });
});

