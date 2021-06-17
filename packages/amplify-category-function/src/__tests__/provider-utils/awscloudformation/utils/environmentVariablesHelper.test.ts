import { $TSContext } from 'amplify-cli-core';
import {
  getStoredEnvironmentVariables,
  saveEnvironmentVariables,
} from '../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper';

const context_stub = {
  amplify: {
    getEnvInfo: () => ({ envName: 'dev' }),
  },
} as $TSContext;

jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getTeamProviderInfo: jest.fn().mockReturnValue(''),
    setTeamProviderInfo: jest.fn().mockReturnValue(''),
    getLocalEnvInfo: jest.fn().mockReturnValue({ envName: 'testenv' }),
  },
  pathManager: {
    findProjectRoot: jest.fn().mockReturnValue(''),
    getBackendDirPath: jest.fn().mockReturnValue(''),
    getTeamProviderInfoFilePath: jest.fn().mockReturnValue(''),
  },
  JSONUtilities: {
    readJson: jest.fn().mockRejectedValue(''),
    writeJson: jest.fn().mockRejectedValue(''),
  },
}));

describe('getStoredEnvironmentVariables', () => {
  it('does not throw error', () => {
    expect(getStoredEnvironmentVariables('test')).toEqual({});
  });
});

describe('deleteEnvironmentVariable', () => {
  it('does not throw error', () => {
    expect(() => {
      saveEnvironmentVariables(context_stub, 'name', { test: 'test' });
    }).not.toThrow();
  });
});
