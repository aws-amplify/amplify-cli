const plugin_manager = require('../../lib/plugin-manager');

describe('executeAmplifyCommand: ', () => {
  const mockExecuteAmplifyCommand = jest.fn();
  const mockPluginCandidates = [];

  const mockPluginModule = {
    executeAmplifyCommand: mockExecuteAmplifyCommand,
  };

  const mockContext = {
    print: {
      info: jest.fn(),
      error: jest.fn(),
    },
  };

  it('executeAmplifyCommand method should exist', () => {
    expect(mockPluginModule.executeAmplifyCommand).toBeDefined();
  });

  describe('case: executeAmplifyCommand is run on a directory where amplify has not been initialized', () => {
    beforeEach(() => {
      mockExecuteAmplifyCommand.mockReturnValue(undefined);
    });

    it('executeAmplifyCommand should fail to add a service and print an error message', async () => {
      await mockPluginModule.executeAmplifyCommand(mockContext);
      expect(mockContext.print.error).toBeCalledWith(
        "You are not working inside a valid amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project with Amplify",
      );
    });
  });
});
