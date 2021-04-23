import { $TSContext } from 'amplify-cli-core';
import {
  getStoredEnvironmentVariables,
  setEnvironmentVariable,
  deleteEnvironmentVariable,
} from '../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper';

const context_stub = {
  amplify: {
    getEnvInfo: () => ({ envName: 'dev' }),
  },
} as $TSContext;

jest.mock('amplify-cli-core', () => ({
  pathManager: {
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
    expect(getStoredEnvironmentVariables(context_stub, 'test')).toEqual({});
  });
});

describe('setEnvironmentVariable', () => {
  it('does not throw error', () => {
    expect(() => {
      setEnvironmentVariable(context_stub, 'test', 'key', 'value');
    }).not.toThrow();
  });
});

describe('deleteEnvironmentVariable', () => {
  it('does not throw error', () => {
    expect(() => {
      deleteEnvironmentVariable(context_stub, 'test', 'test');
    }).not.toThrow();
  });
});
