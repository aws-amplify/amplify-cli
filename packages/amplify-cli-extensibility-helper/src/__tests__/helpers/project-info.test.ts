import { $TSAny, GetOptions, stateManager } from 'amplify-cli-core';
import { getProjectInfo } from '../../helpers/project-info';
import { AmplifyProjectInfo } from '../../types';

describe('project-info', () => {
  let getLocalEnvInfoMock: jest.SpyInstance<$TSAny, [projectPath?: string, options?: GetOptions<any>]>;
  let getProjectConfigMock: jest.SpyInstance<$TSAny, [projectPath?: string, options?: GetOptions<any>]>;

  beforeEach(() => {
    getLocalEnvInfoMock = jest.spyOn(stateManager, 'getLocalEnvInfo').mockImplementation(() => {
      return {
        envName: 'mockEnvironment',
      };
    });
    getProjectConfigMock = jest.spyOn(stateManager, 'getProjectConfig').mockImplementation(() => {
      return {
        projectName: 'mockProject',
      };
    });
  });


  it('returns projectInfo', () => {
    const projectInfo: AmplifyProjectInfo = getProjectInfo();
    expect(projectInfo.envName).toStrictEqual<string>('mockEnvironment');
    expect(projectInfo.projectName).toStrictEqual<string>('mockProject');
    expect(getLocalEnvInfoMock).toHaveBeenCalledTimes(1);
    expect(getProjectConfigMock).toHaveBeenCalledTimes(1);
  });
});
