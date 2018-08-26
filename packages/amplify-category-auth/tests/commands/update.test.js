
jest.mock('fs', () => ({
  readFileSync: () => '{}',
}));
const update = require('../../commands/auth/update');

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

  describe('case: api resource exists', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          auth: {
            foo: 'bar',
          },
          api: {
            foo: 'bar',
          },
        },
      });
    });
    it('update run method should detect presence of api resource and print a message', () => {
      update.run(mockContext);
      expect(mockContext.print.info).toBeCalledWith('\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n');
    });
  });

  describe('case: analytics resource exists', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          auth: {
            foo: 'bar',
          },
          analytics: {
            foo: 'bar',
          },
        },
      });
    });
    it('update run method should detect presence of analytics resource and print a message', () => {
      update.run(mockContext);
      expect(mockContext.print.info).toBeCalledWith('\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n');
    });
  });

  describe('case: function resource exists', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          auth: {
            foo: 'bar',
          },
          function: {
            foo: 'bar',
          },
        },
      });
    });
    it('update run method should detect presence of function resource and print a message', () => {
      update.run(mockContext);
      expect(mockContext.print.info).toBeCalledWith('\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n');
    });
  });

  describe('case: storage resource exists', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          auth: {
            foo: 'bar',
          },
          storage: {
            foo: 'bar',
          },
        },
      });
    });
    it('update run method should detect presence of storage resource and print a message', () => {
      update.run(mockContext);
      expect(mockContext.print.info).toBeCalledWith('\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n');
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

