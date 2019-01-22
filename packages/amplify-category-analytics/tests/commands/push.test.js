const push = require('../../commands/analytics/push');

describe('analytics push: ', () => {
  const mockConstructExeInfo = jest.fn();
  const mockPushResources = jest.fn(() => Promise.resolve());
  const mockPushResourcesWithError = jest.fn(() => Promise.reject('Error'));
  const mockContext = {
    amplify: {
      constructExeInfo: mockConstructExeInfo,
      pushResources: mockPushResources,
    },
    parameters: {
        first: 'analyticsresource'
    },
    print: {
      info: jest.fn().mockImplementation((info) => console.log(info)),
      error: jest.fn().mockImplementation((info) => console.log(info))
    },
  };


  it('run method & name attribute should exist', async () => {
    expect(push.run).toBeDefined();
    expect(push.name).toBeDefined();
    await push.run(mockContext);
    expect(mockContext.amplify.pushResources).toBeCalled();
  });

  it('error out analytics push', async () => {
    mockContext.amplify.pushResources = mockPushResourcesWithError;
    await push.run(mockContext);
    expect(mockContext.print.error).toBeCalledWith('An error occurred when pushing the analytics resource');
  });

});

