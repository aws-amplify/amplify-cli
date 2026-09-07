import { $TSContext, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import execa from 'execa';
import * as fs from 'fs-extra';
import { buildCustomResources } from '../../utils/build-custom-resources';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../utils/dependency-management-utils');
jest.mock('../../utils/generate-cfn-from-cdk');
jest.mock('execa');
jest.mock('ora');
jest.mock('fs-extra');

const fs_mock = fs as jest.Mocked<typeof fs>;
const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;

jest.mock('ora', () => () => ({
  start: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('../../utils/dependency-management-utils', () => ({
  getAllResources: jest.fn().mockResolvedValue({ mockedvalue: 'mockedkey' }),
}));

jest.mock('../../utils/generate-cfn-from-cdk', () => ({
  generateCloudFormationFromCDK: jest.fn(),
}));

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  getPackageManager: jest.fn().mockResolvedValue({
    packageManager: 'npm',
    executable: 'npm',
    runner: 'npx',
    lockFile: 'package-lock.json',
    displayValue: 'NPM',
    getRunScriptArgs: jest.fn(),
    getInstallArgs: jest.fn(),
  }),
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockTargetDir'),
  },
  JSONUtilities: {
    writeJson: jest.fn(),
    readJson: jest.fn(),
    stringify: jest.fn(),
  },
  skipHooks: jest.fn().mockReturnValue(false),
  AmplifyError: class AmplifyError extends Error {
    constructor(name: string, options: { message: string }) {
      super(options.message);
      this.name = name;
    }
  },
}));

describe('build custom resources scenarios', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default fs mocks
    (fs_mock.existsSync as jest.Mock).mockReturnValue(true);
    (fs_mock.readFileSync as jest.Mock).mockReturnValue('mockCode');
    (fs_mock.ensureDirSync as jest.Mock).mockReturnValue(undefined);
    (fs_mock.ensureDir as jest.Mock).mockResolvedValue(undefined);
    (fs_mock.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (fs_mock.writeFile as jest.Mock).mockResolvedValue(undefined);

    // Default: no build script in package.json
    JSONUtilities_mock.readJson.mockReturnValue({});

    mockContext = {
      amplify: {
        openEditor: jest.fn(),
        updateamplifyMetaAfterResourceAdd: jest.fn(),
        copyBatch: jest.fn(),
        getResourceStatus: jest.fn().mockResolvedValue({
          allResources: [
            {
              resourceName: 'mockresource1',
              service: 'customCDK',
            },
            {
              resourceName: 'mockresource2',
              service: 'customCDK',
            },
          ],
        }),
      },
    } as unknown as $TSContext;
  });

  describe('default behavior (no build script)', () => {
    it('should run install and tsc separately when no build script defined', async () => {
      // No build script in package.json
      JSONUtilities_mock.readJson.mockReturnValue({});

      await buildCustomResources(mockContext);

      // 2 for npm install and 2 for tsc build (1 per resource)
      expect(execa.sync).toBeCalledTimes(4);

      // First resource: install then tsc
      expect(execa.sync).toHaveBeenNthCalledWith(1, 'npm', ['install'], expect.objectContaining({ stdio: 'pipe' }));
      expect(execa.sync).toHaveBeenNthCalledWith(2, 'npx', ['tsc'], expect.objectContaining({ stdio: 'pipe' }));

      // Second resource: install then tsc
      expect(execa.sync).toHaveBeenNthCalledWith(3, 'npm', ['install'], expect.objectContaining({ stdio: 'pipe' }));
      expect(execa.sync).toHaveBeenNthCalledWith(4, 'npx', ['tsc'], expect.objectContaining({ stdio: 'pipe' }));
    });

    it('should run install and tsc when package.json has scripts but no build script', async () => {
      // package.json with scripts but no build script
      JSONUtilities_mock.readJson.mockReturnValue({
        scripts: {
          test: 'jest',
          lint: 'eslint .',
        },
      });

      await buildCustomResources(mockContext);

      // Should still run install + tsc for each resource
      expect(execa.sync).toBeCalledTimes(4);
      expect(execa.sync).toHaveBeenNthCalledWith(1, 'npm', ['install'], expect.objectContaining({ stdio: 'pipe' }));
    });
  });

  describe('custom build script behavior', () => {
    it('should run build script when package.json has scripts.build defined', async () => {
      // package.json with build script
      JSONUtilities_mock.readJson.mockReturnValue({
        scripts: {
          build: 'pnpm install --ignore-workspace && tsc',
        },
      });

      await buildCustomResources(mockContext);

      // Only 2 calls (1 per resource) for 'npm run build'
      expect(execa.sync).toBeCalledTimes(2);

      expect(execa.sync).toHaveBeenNthCalledWith(1, 'npm', ['run', 'build'], expect.objectContaining({ stdio: 'pipe' }));
      expect(execa.sync).toHaveBeenNthCalledWith(2, 'npm', ['run', 'build'], expect.objectContaining({ stdio: 'pipe' }));
    });

    it('should not call install or tsc separately when build script is defined', async () => {
      JSONUtilities_mock.readJson.mockReturnValue({
        scripts: {
          build: 'custom-build-command',
        },
      });

      await buildCustomResources(mockContext);

      // Verify install and tsc are NOT called
      const calls = (execa.sync as jest.Mock).mock.calls;
      const hasInstallCall = calls.some((call) => call[1]?.[0] === 'install');
      const hasTscCall = calls.some((call) => call[1]?.[0] === 'tsc');

      expect(hasInstallCall).toBe(false);
      expect(hasTscCall).toBe(false);
    });
  });

  describe('hasBuildScript edge cases', () => {
    it('should fall back to install+tsc when package.json does not exist', async () => {
      // package.json doesn't exist for the custom resource
      (fs_mock.existsSync as jest.Mock).mockImplementation((filePath: unknown) => {
        if (typeof filePath === 'string' && filePath.includes('package.json')) {
          return false;
        }
        return true;
      });

      await buildCustomResources(mockContext);

      // Should run install + tsc (default behavior)
      expect(execa.sync).toBeCalledTimes(4);
    });
  });
});
