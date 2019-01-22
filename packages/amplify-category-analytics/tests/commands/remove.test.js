const remove = require('../../commands/analytics/remove');

describe('analytics remove: ', () => {
  const mockRemoveResource = jest.fn(() => Promise.resolve());
  const mockRemoveResourceWithError = jest.fn(() => Promise.reject('Error'));
  const mockContext = {
    amplify: {
      removeResource: mockRemoveResource
    },
    parameters: {
        first: 'analyticsresource'
    },
    print: {
      info: jest.fn().mockImplementation((info) => console.log(info)),
      error: jest.fn().mockImplementation((info) => console.log(info))
    },
  };


  it('successfully run amplify remove analytics', async () => {
    expect(remove.run).toBeDefined();
    expect(remove.name).toBeDefined();
    await remove.run(mockContext);
    expect(mockContext.amplify.removeResource).toBeCalled();
  });

  it('error out on amplify remove analytics', async () => {
    mockContext.amplify.removeResource = mockRemoveResourceWithError;
    await remove.run(mockContext);
    expect(mockContext.print.error).toBeCalledWith('An error occurred when removing the analytics resource');
  });

});
