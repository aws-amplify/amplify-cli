import fs from 'fs-extra';
import { executeAmplifyCommandForPlugin } from '../execution-manager';

describe('executeAmplifyCommand: ', () => {
  const mockExecuteAmplifyCommand = jest.fn();
  const mockContext = {
    print: {
      info: jest.fn(),
    },
  };

  const mockPluginModule = {
    executeAmplifyCommand: mockExecuteAmplifyCommand,
  };

  describe('case: executeAmplifyCommand is run on a directory where amplify is not initialized', () => {
    const err = new Error(
      "You are not working inside a valid amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project with Amplify",
    );

    beforeEach(() => {
      mockExecuteAmplifyCommand.mockReturnValue(err);
      (fs.existsSync as any).mockReturnValue(true);
    });

    it('executeAmplifyCommand should fail to add a service and print an error message', async () => {
      await (executeAmplifyCommandForPlugin as any)(mockContext, mockPluginModule);
      expect(mockExecuteAmplifyCommand).toReturnWith(err);
    });
  });

  describe('case: executeAmplifyCommand returns a stack trace error', () => {
    const err = new Error('An unexpected error has occurred');

    beforeEach(() => {
      mockExecuteAmplifyCommand.mockReturnValue(err.stack);
      (fs.existsSync as any).mockReturnValue(true);
    });

    it('executeAmplifyCommand should get an unexpected error and print a stack trace', async () => {
      await (executeAmplifyCommandForPlugin as any)(mockContext, mockPluginModule);

      expect(mockExecuteAmplifyCommand).toReturnWith(err.stack);
    });
  });
});
