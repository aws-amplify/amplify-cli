import fs from 'fs-extra';
import { executeAmplifyCommandForPlugin } from '../../lib/execution-manager';

describe('executeAmplifyCommand: ', () => {
  const mockExecuteAmplifyCommand = jest.fn();
  const mockContext = {};

  const mockPluginModule = {
    executeAmplifyCommand: mockExecuteAmplifyCommand,
  };

  describe('case: executeAmplifyCommand is run on a directory where amplify is not initialized', () => {
    beforeEach(() => {
      mockExecuteAmplifyCommand.mockReturnValue(
        new Error(
          "You are not working inside a valid amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project with Amplify",
        ),
      );
      (fs.existsSync as any).mockReturnValue(true);
    });

    it('executeAmplifyCommand should fail to add a service and print an error message', async () => {
      await (executeAmplifyCommandForPlugin as any)(mockContext, mockPluginModule);
      expect(mockExecuteAmplifyCommand).toReturnWith(
        new Error(
          "You are not working inside a valid amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project with Amplify",
        ),
      );
    });
  });
});
