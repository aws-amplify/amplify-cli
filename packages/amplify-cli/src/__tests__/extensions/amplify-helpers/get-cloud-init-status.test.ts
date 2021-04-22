import * as fs from 'fs-extra';
import {
  getCloudInitStatus,
  CLOUD_INITIALIZED,
  CLOUD_NOT_INITIALIZED,
  NON_AMPLIFY_PROJECT,
} from '../../../extensions/amplify-helpers/get-cloud-init-status';

jest.mock('fs-extra');
jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getAmplifyMetaFilePath: jest.fn().mockReturnValue('/home/user/project/amplify/backend/amplify-meta.json'),
    getBackendConfigFilePath: jest.fn().mockReturnValue('/home/user/project/amplify/backend/backend-config.json'),
  },
}));

const fsMock = fs as jest.Mocked<typeof fs>;

describe('getCloudInitStatus', () => {
  test('returns CLOUD_INITIALIZED when amplify meta file exists', () => {
    fsMock.existsSync.mockReturnValue(true);
    expect(getCloudInitStatus()).toBe(CLOUD_INITIALIZED);
  });

  test('returns CLOUD_NOT_INITIALIZED when no amplify meta file exists and backend config file exists', () => {
    fsMock.existsSync.mockReturnValue(true).mockReturnValueOnce(false);
    expect(getCloudInitStatus()).toBe(CLOUD_NOT_INITIALIZED);
  });

  test('returns NON_AMPLIFY_PROJECT when no amplify meta file and backend config file exists', () => {
    fsMock.existsSync.mockReturnValue(false);
    expect(getCloudInitStatus()).toBe(NON_AMPLIFY_PROJECT);
  });
});
