import { HydrateTags } from 'amplify-cli-core';
describe('getTags', () => {
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
      isTagFilePresent: jest.fn().mockReturnValue(false),
      localEnvInfoExists: jest.fn().mockReturnValue(false),
    },
    HydrateTags,
  });
  jest.setMock('../extensions/amplify-helpers/get-project-details', {
    getProjectDetails: jest.fn().mockReturnValue(mockConfig),
  });

  const { getTags } = require('../extensions/amplify-helpers/get-tags');
  const mockContext = {
    exeInfo: {
      ...mockConfig,
    },
  };

  it('getTags exists', () => {
    expect(getTags).toBeDefined();
  });

  it('test for values', () => {
    const readTags = getTags(mockContext);
    expect(readTags).toBeDefined();
    expect(readTags.filter(r => r.Key === 'user:Application')[0].Value).toEqual(mockConfig.projectConfig.projectName);
    expect(readTags.filter(r => r.Key === 'user:Stack')[0].Value).toEqual(mockConfig.localEnvInfo.envName);
  });
});
