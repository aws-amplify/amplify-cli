const add = require('../../commands/auth/enable');

describe('auth enable: ', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();
  const mockSelectionPrompt = jest.fn(() => Promise.resolve({}));
  const mockProjectPath = '/User/someone/Documents/Project/amplify-test';
  const mockContext = {
    amplify: {
      executeProviderUtils: mockExecuteProviderUtils,
      getProjectDetails: mockGetProjectDetails,
      serviceSelectionPrompt: mockSelectionPrompt,
    },
    print: {
      warning: jest.fn(),
    },
  };


  afterEach(() => {
    mockGetProjectDetails.mockReturnValue({});
  });

  it('enable run method should exist', () => {
    expect(add.run).toBeDefined();
  });

  describe('case: auth already enabled', () => {
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
    it('enable method should detect existing auth metadata', () => {
      add.run(mockContext);
      expect(mockContext.print.warning).toBeCalledWith('Auth has already been added to this project. To update run amplify update auth');
    });
  });

  describe('case: auth not yet enabled', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {},
      });
    });
    it('service selection prompt should be called', () => {
      add.run(mockContext);
      expect(mockContext.amplify.serviceSelectionPrompt).toBeCalled();
    });
  });
});

