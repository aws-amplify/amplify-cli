const path = require('path');
const fs = require('fs-extra');
const execa = require('execa');

import { $TSContext } from 'amplify-cli-core';
import { generateOverrideSkeleton } from '../../utils/override-skeleton-generator';

const mockProjectPath = 'mockProjectPath';
const context_stub = {
  amplify: {
    pathManager: {
      getBackendDirPath: () => path.join(mockProjectPath, 'amplify', 'backend'),
    },
  },
} as unknown as jest.Mocked<$TSContext>;

jest.mock('execa', () => ({
  sync: jest.fn(),
}));

jest.mock('fs-extra', () => ({
  ensureDirSync: jest.fn(),
  copySync: jest.fn(),
  existsSync: jest.fn(),
}));

jest.mock('amplify-cli-core', () => ({
  getPackageManager: () => ({
    executable: 'npm',
  }),
}));

describe('run override command for root stack', () => {
  test('generate override skeleton package and build with npm as package manager ', async () => {
    await generateOverrideSkeleton(context_stub);

    const overridesDirPath = path.join(mockProjectPath, 'amplify', 'backend', 'awscloudformation', 'overrides');
    expect(fs.ensureDirSync).toBeCalledWith(overridesDirPath);

    expect(execa.sync).toBeCalledWith('npm', ['install'], {
      cwd: overridesDirPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    expect(execa.sync).toBeCalledWith('tsc', [], {
      cwd: overridesDirPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  });
});
