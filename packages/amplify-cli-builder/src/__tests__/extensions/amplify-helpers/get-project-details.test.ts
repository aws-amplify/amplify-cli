import { getProjectDetails } from '../../../extensions/amplify-helpers/get-project-details';
import { stateManager } from 'amplify-cli-core';

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

jest.mock('../../../extensions/amplify-helpers/get-env-info', () => ({
  getEnvInfo: jest.fn().mockReturnValue({ envName: 'test' }),
}));

jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getLocalEnvInfo: jest.fn(),
    getProjectConfig: jest.fn(),
    metaFileExists: jest.fn(),
    getMeta: jest.fn().mockReturnValue({
      providers: {
        awscloudformation: {},
      },
    }),
    teamProviderInfoExists: jest.fn(),
    getTeamProviderInfo: jest.fn().mockReturnValue({ production: 'test', develop: 'test', staging: 'test' }),
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
    stateManagerMock.teamProviderInfoExists.mockReturnValue(false);

    const response = getProjectDetails();
    expect(response).toStrictEqual({
      amplifyMeta: {},
      projectConfig: mockProjectConfig,
      localEnvInfo: {
        envName: 'test',
      },
      teamProviderInfo: {},
    });
  });
  it('should return correctly if amplify-meta.json and team-provider-info.json exist', () => {
    stateManagerMock.metaFileExists.mockReturnValue(true);
    stateManagerMock.teamProviderInfoExists.mockReturnValue(true);
    const response = getProjectDetails();
    expect(stateManagerMock.getMeta.mock.calls.length).toBe(1);
    expect(stateManagerMock.getTeamProviderInfo.mock.calls.length).toBe(1);
    expect(response).toStrictEqual({
      amplifyMeta: {
        providers: {
          awscloudformation: {},
        },
      },
      projectConfig: mockProjectConfig,
      localEnvInfo: {
        envName: 'test',
      },
      teamProviderInfo: { develop: 'test', production: 'test', staging: 'test' },
    });
  });
});
