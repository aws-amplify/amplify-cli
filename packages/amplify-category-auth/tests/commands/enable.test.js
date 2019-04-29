const fs = require('fs');
const add = require('../../commands/auth/enable');
const { messages } = require('../../provider-utils/awscloudformation/assets/string-maps');


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
      readJsonFile: jest.fn(path => JSON.parse(fs.readFileSync(path))),
    },
    print: {
      warning: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    },
  };

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
    it('enable method should detect existing auth metadata and return after printing warning text', async () => {
      await add.run(mockContext);
      expect(mockContext.print.warning).toBeCalledWith(messages.authExists);
      expect(mockContext.amplify.serviceSelectionPrompt).not.toBeCalled();
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
    it('service selection prompt should be called', async () => {
      await add.run(mockContext);
      expect(mockContext.amplify.serviceSelectionPrompt).toBeCalled();
    });
  });
});

