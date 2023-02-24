import { stateManager, toolkitExtensions } from '../..';
import * as getEnvInfo from '../../toolkit-extensions/get-env-info';
const { getProjectDetails } = toolkitExtensions;

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

const mockProjectConfig = {
  projectName: 'mockProjectName',
  version: '2.0',
  frontend: 'javascript',
  javascript: {
    framework: 'none',
    config: {
      SourceDir: 'src',
      DistributionDir: 'dist',
      BuildCommand: 'npm run-script build',
      StartCommand: 'npm run-script start',
    },
  },
  providers: ['awscloudformation'],
};
jest.spyOn(stateManagerMock, 'getProjectConfig').mockReturnValue(mockProjectConfig);
jest.spyOn(stateManagerMock, 'localEnvInfoExists');
jest.spyOn(stateManagerMock, 'getLocalEnvInfo');
jest.spyOn(stateManagerMock, 'metaFileExists');
jest.spyOn(stateManagerMock, 'backendConfigFileExists');
jest.spyOn(stateManagerMock, 'getMeta').mockReturnValue({
  providers: {
    awscloudformation: {},
  },
});
jest.spyOn(stateManagerMock, 'getBackendConfig').mockReturnValue({});

jest.spyOn(stateManagerMock, 'backendConfigFileExists');
jest.spyOn(getEnvInfo, 'getEnvInfo').mockReturnValue({ envName: 'test' });

describe('getProjectDetails', () => {
  beforeEach(() => {
    stateManagerMock.getProjectConfig.mockReturnValue(mockProjectConfig);
  });

  it('should return correctly if there is not amplify-meta.json and team-provider.json', () => {
    stateManagerMock.metaFileExists.mockReturnValue(false);

    const response = getProjectDetails();
    expect(response).toStrictEqual({
      amplifyMeta: {},
      projectConfig: mockProjectConfig,
      backendConfig: {},
      localEnvInfo: {
        envName: 'test',
      },
    });
  });

  it('should return correctly if amplify-meta.json and team-provider-info.json exist', () => {
    stateManagerMock.metaFileExists.mockReturnValue(true);
    stateManagerMock.backendConfigFileExists.mockReturnValue(true);
    const response = getProjectDetails();
    expect(stateManagerMock.getMeta.mock.calls.length).toBe(1);
    expect(stateManagerMock.getBackendConfig.mock.calls.length).toBe(1);
    expect(response).toStrictEqual({
      amplifyMeta: {
        providers: {
          awscloudformation: {},
        },
      },
      projectConfig: mockProjectConfig,
      backendConfig: {},
      localEnvInfo: {
        envName: 'test',
      },
    });
  });
});
