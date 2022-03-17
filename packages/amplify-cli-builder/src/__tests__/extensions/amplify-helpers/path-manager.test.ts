import * as path from 'path';
import { homedir } from 'os';
import { amplifyCLIConstants } from '../../../extensions/amplify-helpers/constants';
import {
  searchProjectRootPath,
  getHomeDotAmplifyDirPath,
  getAmplifyDirPath,
  getDotConfigDirPath,
  getBackendDirPath,
  getCurrentCloudBackendDirPath,
  getAmplifyRcFilePath,
  getGitIgnoreFilePath,
  getProjectConfigFilePath,
  getLocalEnvFilePath,
  getProviderInfoFilePath,
  getBackendConfigFilePath,
  getCurrentBackendConfigFilePath,
  getAmplifyMetaFilePath,
  getCurrentAmplifyMetaFilePath,
} from '../../../extensions/amplify-helpers/path-manager';

jest.mock('fs-extra', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

describe('searchProjectRootPath', () => {
  it('return project root path when file exists', () => {
    const result = searchProjectRootPath();
    expect(result).toBe(process.cwd());
  });
});

describe('getHomeDotAmplifyDirPath', () => {
  it('return joined amplify dir name', () => {
    const result = getHomeDotAmplifyDirPath();
    expect(result).toBe(path.join(homedir(), amplifyCLIConstants.DotAmplifyDirName));
  });
});

describe('getAmplifyDirPath', () => {
  it('return normalized amplify dir path', () => {
    const result = getAmplifyDirPath();
    expect(result).toBe(path.normalize(path.join(process.cwd(), amplifyCLIConstants.AmplifyCLIDirName)));
  });
});

describe('getDotConfigDirPath', () => {
  it('return normalized dot config dir path', () => {
    const result = getDotConfigDirPath();
    const amplifyDirPath = getAmplifyDirPath();
    expect(result).toBe(path.normalize(path.join(amplifyDirPath, amplifyCLIConstants.DotConfigamplifyCLISubDirName)));
  });
});

describe('getBackendDirPath', () => {
  it('return normalized backend dir path', () => {
    const result = getBackendDirPath();
    const amplifyDirPath = getAmplifyDirPath();
    expect(result).toBe(path.normalize(path.join(amplifyDirPath, amplifyCLIConstants.BackendamplifyCLISubDirName)));
  });
});

describe('getCurrentCloudBackendDirPath', () => {
  it('return normalized current cloud backend dir path', () => {
    const result = getCurrentCloudBackendDirPath();
    const amplifyDirPath = getAmplifyDirPath();
    expect(result).toBe(path.normalize(path.join(amplifyDirPath, amplifyCLIConstants.CurrentCloudBackendamplifyCLISubDirName)));
  });
});

describe('getAmplifyRcFilePath', () => {
  it('return normalized amplify rc file path', () => {
    const result = getAmplifyRcFilePath();
    expect(result).toBe(path.normalize(path.join(process.cwd(), '.amplifyrc')));
  });
});

describe('getGitIgnoreFilePath', () => {
  it('return normalized git ignore file path', () => {
    const result = getGitIgnoreFilePath();
    expect(result).toBe(path.normalize(path.join(process.cwd(), '.gitignore')));
  });
});

describe('getProjectConfigFilePath', () => {
  it('return normalized project config file path', () => {
    const result = getProjectConfigFilePath();
    const dotConfigDir = getDotConfigDirPath();
    expect(result).toBe(path.normalize(path.join(dotConfigDir, amplifyCLIConstants.ProjectConfigFileName)));
  });
});

describe('getLocalEnvFilePath', () => {
  it('return normalized local env file path', () => {
    const result = getLocalEnvFilePath();
    const dotConfigDir = getDotConfigDirPath();
    expect(result).toBe(path.normalize(path.join(dotConfigDir, amplifyCLIConstants.LocalEnvFileName)));
  });
});

describe('getProviderInfoFilePath', () => {
  it('return normalized provider info file path', () => {
    const result = getProviderInfoFilePath();
    const amplifyDir = getAmplifyDirPath();
    expect(result).toBe(path.normalize(path.join(amplifyDir, amplifyCLIConstants.ProviderInfoFileName)));
  });
});

describe('getBackendConfigFilePath', () => {
  it('return normalized backend config file path', () => {
    const result = getBackendConfigFilePath();
    const backendDir = getBackendDirPath();
    expect(result).toBe(path.normalize(path.join(backendDir, amplifyCLIConstants.BackendConfigFileName)));
  });
});

describe('getCurrentBackendConfigFilePath', () => {
  it('return normalized current backend config file path', () => {
    const result = getCurrentBackendConfigFilePath();
    const currentCloudBackendDir = getCurrentCloudBackendDirPath();
    expect(result).toBe(path.normalize(path.join(currentCloudBackendDir, amplifyCLIConstants.BackendConfigFileName)));
  });
});

describe('getAmplifyMetaFilePath', () => {
  it('return normalized amplify meta file path', () => {
    const result = getAmplifyMetaFilePath();
    const backendDir = getBackendDirPath();
    expect(result).toBe(path.normalize(path.join(backendDir, amplifyCLIConstants.amplifyMetaFileName)));
  });
});

describe('getCurrentAmplifyMetaFilePath', () => {
  it('return normalized current amplify meta file path', () => {
    const result = getCurrentAmplifyMetaFilePath();
    const currentCloudBackendDir = getCurrentCloudBackendDirPath();
    expect(result).toBe(path.normalize(path.join(currentCloudBackendDir, amplifyCLIConstants.amplifyMetaFileName)));
  });
});
