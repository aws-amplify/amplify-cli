describe('getTags', () => {
  const mockedTags = [
    {
      Key: 'projectName',
      Value: '{project-name}',
    },
    {
      Key: 'projectenv',
      Value: '{project-env}',
    },
  ];
  const mockConfig = {
    projectConfig: {
      projectName: 'foo',
    },
    localEnvInfo: {
      envName: 'bar',
    },
  };
  jest.setMock('amplify-cli-core', {
    stateManager: {
      getProjectTags: jest.fn().mockReturnValue(mockedTags),
    },
  });
  jest.setMock('../extensions/amplify-helpers/get-project-details', {
    getProjectDetails: jest.fn().mockReturnValue(mockConfig),
  });

  const { getTags } = require('../extensions/amplify-helpers/get-tags');

  it('getTags exists', () => {
    expect(getTags).toBeDefined();
  });

  it('test for values', () => {
    const readTags = getTags();
    expect(readTags).toBeDefined();
    expect(readTags.filter(r => r.Key === 'projectName')[0].Value).toEqual(mockConfig.projectConfig.projectName);
    expect(readTags.filter(r => r.Key === 'projectenv')[0].Value).toEqual(mockConfig.localEnvInfo.envName);
  });
});
