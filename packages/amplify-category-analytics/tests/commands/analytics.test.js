const analyticsHelp = require('../../commands/analytics');

describe('analytics help: ', () => {
  const mockRemoveResource = jest.fn(() => Promise.resolve());
  const mockRemoveResourceWithError = jest.fn(() => Promise.reject('Error'));
  const mockContext = {
    amplify: {
      showHelp: jest.fn()
    },
    parameters: {
        first: 'analytics'
    },
    print: {
      info: jest.fn().mockImplementation((info) => console.log(info)),
      error: jest.fn().mockImplementation((info) => console.log(info))
    },
  };


  it('successfully run amplify analytics', async () => {
    await analyticsHelp.run(mockContext);
    expect(mockContext.amplify.showHelp).toBeCalled();
  });

});
