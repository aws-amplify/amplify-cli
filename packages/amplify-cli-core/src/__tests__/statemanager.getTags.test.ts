import { stateManager } from '../state-manager';
import { Tag } from '../tags';
describe('getTags', () => {
  const mockedTags: Tag[] = [
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
  const mockGetProjectTags = jest.spyOn(stateManager, 'getProjectTags').mockReturnValue(mockedTags);
  const mockgetProjectConfig = jest.spyOn(stateManager, 'getProjectConfig').mockReturnValue(mockConfig.projectConfig);
  const mockgetLocalEnvInfo = jest.spyOn(stateManager, 'getLocalEnvInfo').mockReturnValue(mockConfig.localEnvInfo);

  it('test for values', () => {
    const readTags = stateManager.getHydratedTags(undefined);
    expect(readTags).toBeDefined();
    expect(readTags.filter(r => r.Key === 'projectName')[0].Value).toEqual(mockConfig.projectConfig.projectName);
    expect(readTags.filter(r => r.Key === 'projectenv')[0].Value).toEqual(mockConfig.localEnvInfo.envName);
    expect(mockGetProjectTags).toBeCalled();
    expect(mockgetProjectConfig).toBeCalled();
    expect(mockgetLocalEnvInfo).toBeCalled();
  });
});
