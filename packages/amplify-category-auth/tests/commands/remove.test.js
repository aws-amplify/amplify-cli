const remove = require('../../commands/auth/remove');

describe('auth remove: ', () => {
  const mockExecuteProviderUtils = jest.fn();
  const mockGetProjectDetails = jest.fn();
  const warningString = '\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n';
  const mockRemoveResource = jest.fn(() => Promise.resolve({}));
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


  afterEach(() => {
    mockGetProjectDetails.mockReturnValue({});
  });

  it('remove run method should exist', () => {
    expect(remove.run).toBeDefined();
  });

  describe('case: analytics already enabled', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          analytics: {
            foo: 'bar',
          },
        },
      });
    });
    it('remove method should detect existing analytics metadata and display warning', () => {
      remove.run(mockContext);
      expect(mockContext.print.info).toBeCalledWith(warningString);
    });
  });

  describe('case: api already enabled', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          api: {
            foo: 'bar',
          },
        },
      });
    });
    it('remove method should detect existing api metadata and display warning', () => {
      remove.run(mockContext);
      expect(mockContext.print.info).toBeCalledWith(warningString);
    });
  });

  describe('case: function already enabled', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          function: {
            foo: 'bar',
          },
        },
      });
    });
    it('remove method should detect existing function metadata and display warning', () => {
      remove.run(mockContext);
      expect(mockContext.print.info).toBeCalledWith(warningString);
    });
  });

  describe('case: storage already enabled', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {
          storage: {
            foo: 'bar',
          },
        },
      });
    });
    it('remove method should detect existing storage metadata and display warning', () => {
      remove.run(mockContext);
      expect(mockContext.print.info).toBeCalledWith(warningString);
    });
  });

  describe('case: auth and other resources not yet enabled', () => {
    beforeEach(() => {
      mockGetProjectDetails.mockReturnValue({
        projectConfig: {
          projectPath: mockProjectPath,
        },
        amplifyMeta: {},
      });
    });
    it('service selection prompt should be called', () => {
      remove.run(mockContext);
      expect(mockContext.amplify.removeResource).toBeCalled();
    });
  });
});

