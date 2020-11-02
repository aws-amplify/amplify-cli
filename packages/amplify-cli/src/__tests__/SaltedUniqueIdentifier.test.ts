describe('test salted unique identifier', () => {
  const mockMeta = {
    providers: {
      awscloudformation: {
        StackId: 'arn:aws:cloudformation:us-east-1:012345678911:stack/amplify-dummyproj-prod-164239/1b625f60-18ae-11eb-9e65-0ab042f700a7',
      },
    },
  };
  const mockProfileName = 'default';
  const mockAccessKeyId = 'AKIASDDDASDSAD54OIQQ';

  const mockgetProfileAccessKey = jest.fn().mockReturnValue(mockAccessKeyId);
  const mockPlugin = {
    getProfileAccessKeyId: mockgetProfileAccessKey,
  };
  const mockGetPluginInstance = jest.fn().mockReturnValue(mockPlugin);

  const mockContext = jest.genMockFromModule('../domain/context') as any;
  mockContext['amplify'] = {
    getPluginInstance: mockGetPluginInstance,
  };
  jest.setMock('amplify-cli-core', {
    stateManager: {
      getMeta: jest.fn().mockReturnValue(mockMeta),
      getCurrentProfileName: jest.fn().mockReturnValue(mockProfileName),
    },
  });

  it('test for consistency', () => {
    const key1 = require('../domain/amplify-usageData/SaltedUniqueIdentifier').createSaltedUniqueIdentifier(mockContext);
    const key2 = require('../domain/amplify-usageData/SaltedUniqueIdentifier').createSaltedUniqueIdentifier(mockContext);

    expect(key1).toBeDefined();
    expect(key1).toEqual(key2);
  });
});
