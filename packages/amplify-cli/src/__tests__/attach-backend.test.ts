import { $TSContext, stateManager } from 'amplify-cli-core';
import { attachBackend } from '../attach-backend';

jest.mock('../amplify-service-helper');
jest.mock('../attach-backend-steps/a10-queryProvider');
jest.mock('../attach-backend-steps/a20-analyzeProject');
jest.mock('../attach-backend-steps/a30-initFrontend');
jest.mock('../attach-backend-steps/a40-generateFiles');
jest.mock('../initialize-env');
jest.mock('amplify-prompts');

jest.mock('amplify-cli-core');
jest.mock('fs-extra');
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

const testAppId = 'testAppId';

stateManagerMock.getTeamProviderInfo.mockReturnValue({
  test: {
    awscloudformation: {
      AmplifyAppId: testAppId,
    },
  },
});

stateManagerMock.getLocalEnvInfo.mockReturnValue({
  noUpdateBackend: true,
  envName: 'test',
});
stateManagerMock.getLocalAWSInfo.mockReturnValue({
  test: {},
});

describe('attachBackend', () => {
  it('sets input params appId to team provider app id if not already present', async () => {
    const inputParams = {
      yes: true,
      test: {},
      amplify: {
        defaultEditor: 'test',
        projectName: 'test',
        envName: 'test',
        frontend: 'test',
        noOverride: false,
      },
    };
    const contextStub = {
      exeInfo: {
        awsConfigInfo: {},
      },
    } as unknown as $TSContext;
    await attachBackend(contextStub, inputParams);
    expect(contextStub.exeInfo.inputParams.amplify.appId).toBe(testAppId);
  });
});
