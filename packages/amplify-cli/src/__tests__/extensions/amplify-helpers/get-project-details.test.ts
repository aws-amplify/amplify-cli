import { stateManager } from '@aws-amplify/amplify-cli-core';
import { getProjectDetails } from '../../../extensions/amplify-helpers/get-project-details';

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

jest.mock('../../../extensions/amplify-helpers/get-env-info', () => ({
  getEnvInfo: jest.fn().mockReturnValue({ envName: 'test' }),
}));

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  stateManager: {
    getLocalEnvInfo: jest.fn(),
    getProjectConfig: jest.fn(),
    metaFileExists: jest.fn(),
    backendConfigFileExists: jest.fn(),
    getMeta: jest.fn().mockReturnValue({
      providers: {
        awscloudformation: {},
      },
    }),
    getBackendConfig: jest.fn().mockReturnValue({}),
  },
}));

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
