const { addResource } = require('../../provider-utils/awscloudformation/index');

describe('check addResource in index.js: ', () => {
  const mockContext = {
    print: {
      info: jest.fn().mockImplementation(info => console.log(info)),
      error: jest.fn().mockImplementation(info => console.log(info)),
    },
  };

  const mockWalkthrough = { addWalkthrough: jest.fn(() => Promise.resolve()) };

  it('successfully run addWalkthrough function ', async () => {
    expect(addResource).toBeDefined();
    jest.mock('../../provider-utils/awscloudformation/service-walkthroughs/pinpoint-walkthrough', () => mockWalkthrough);
    await addResource(mockContext, 'analytics', 'Pinpoint');
    expect(mockWalkthrough.addWalkthrough).toBeCalled();
  });
});
