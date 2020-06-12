const push = require('../../commands/auth/push');

jest.mock('../../provider-utils/awscloudformation/utils/trigger-file-uploader', () => {
  return {
    uploadFiles: jest.fn(() => Promise.reject(new Error())),
  };
});

describe('auth push: ', () => {
  const mockConstructExeInfo = jest.fn();
  const mockPushResources = jest.fn();

  const mockContext = {
    amplify: {
      constructExeInfo: mockConstructExeInfo,
      pushResources: mockPushResources,
    },
    parameters: {
      first: '',
    },
    print: {
      info: jest.fn(),
      error: jest.fn(),
    },
  };

  it('push run method should exist', () => {
    expect(push.run).toBeDefined();
  });

  describe('case: amplify pushResources fails to make updates to backend environment', () => {
    beforeEach(() => {
      mockPushResources.mockReturnValue(Promise.reject(new Error('mocking pushResources() promise rejection')));
    });

    it('push run method should fail to push resources and print an error message', async () => {
      await push.run(mockContext);
      expect(mockContext.print.error).toBeCalledWith('There was an error pushing the auth resource');
    });
  });

  describe('case: uploadFiles fails to upload trigger files to S3', () => {
    it('push run method should fail to push resources and print an error message', async () => {
      await push.run(mockContext);
      expect(mockContext.print.error).toBeCalledWith('There was an error pushing the auth resource');
    });
  });
});
