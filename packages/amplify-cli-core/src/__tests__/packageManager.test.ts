import * as path from 'path';
import which from 'which';
import { getPackageManager } from '../utils';
import * as shellUtils from '../utils/shell-utils';

jest.mock('which');
jest.mock('../utils/shell-utils');

describe('packageManager tests', () => {
  const baseDirectory = path.join(__dirname, 'testFiles');
  const which_mock = which as jest.Mocked<typeof which>;
  const shellUtils_mock = shellUtils as jest.Mocked<typeof shellUtils>;

  beforeEach(() => {
    jest.resetAllMocks();
    // Default to returning undefined (executable not found)
    // Tests that need specific executables should set them explicitly
    (which_mock.sync as jest.Mock).mockReturnValue(undefined);
    // Mock yarn --version to return a valid version
    shellUtils_mock.execWithOutputAsString.mockResolvedValue('4.0.0');
  });

  test('returns null when no package.json found', async () => {
    const testDirectory = path.join(baseDirectory, 'packageManager-null');

    const packageManager = await getPackageManager(testDirectory);

    expect(packageManager).toBeNull();
  });

  test('detects yarn2 correctly', async () => {
    (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
      if (executable === 'yarn') return '/path/to/yarn';
      return undefined;
    });

    const testDirectory = path.join(baseDirectory, 'packageManager-yarn2');

    const packageManager = await getPackageManager(testDirectory);

    expect(packageManager).toBeDefined();
    expect(packageManager?.packageManager).toEqual('yarn');
    expect(packageManager?.version?.major).toBeGreaterThanOrEqual(2);
  });

  test('detects yarn correctly', async () => {
    (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
      if (executable === 'yarn') return '/path/to/yarn';
      return undefined;
    });

    const testDirectory = path.join(baseDirectory, 'packageManager-yarn');

    const packageManager = await getPackageManager(testDirectory);

    expect(packageManager).toBeDefined();
    expect(packageManager!.packageManager).toEqual('yarn');
  });

  test('detects npm correctly', async () => {
    // No executables in PATH - should fall back to npm via lock file
    const testDirectory = path.join(baseDirectory, 'packageManager-npm');

    const packageManager = await getPackageManager(testDirectory);

    expect(packageManager).toBeDefined();
    expect(packageManager!.packageManager).toEqual('npm');
  });

  test('detects yarn fallback correctly when yarn in path', async () => {
    (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
      if (executable === 'yarn') return '/path/to/yarn';
      return undefined;
    });

    const testDirectory = path.join(baseDirectory, 'packageManager-fallback');

    const packageManager = await getPackageManager(testDirectory);

    expect(packageManager).toBeDefined();
    expect(packageManager!.packageManager).toEqual('yarn');
  });

  test('detects npm fallback correctly when yarn is not in path', async () => {
    // No executables in PATH (already set in beforeEach)
    const testDirectory = path.join(baseDirectory, 'packageManager-fallback');

    const packageManager = await getPackageManager(testDirectory);

    expect(packageManager).toBeDefined();
    expect(packageManager!.packageManager).toEqual('npm');
  });

  describe('packageManager field detection (corepack convention)', () => {
    test('detects pnpm from packageManager field in package.json', async () => {
      (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
        if (executable === 'pnpm') return '/path/to/pnpm';
        return undefined;
      });

      const testDirectory = path.join(baseDirectory, 'packageManager-pnpm-field');

      const packageManager = await getPackageManager(testDirectory);

      expect(packageManager).toBeDefined();
      expect(packageManager!.packageManager).toEqual('pnpm');
    });

    test('detects npm from packageManager field in package.json', async () => {
      (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
        if (executable === 'npm') return '/path/to/npm';
        return undefined;
      });

      const testDirectory = path.join(baseDirectory, 'packageManager-npm-field');

      const packageManager = await getPackageManager(testDirectory);

      expect(packageManager).toBeDefined();
      expect(packageManager!.packageManager).toEqual('npm');
    });

    test('detects yarn from packageManager field in package.json', async () => {
      (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
        if (executable === 'yarn') return '/path/to/yarn';
        return undefined;
      });

      const testDirectory = path.join(baseDirectory, 'packageManager-yarn-field');

      const packageManager = await getPackageManager(testDirectory);

      expect(packageManager).toBeDefined();
      expect(packageManager!.packageManager).toEqual('yarn');
    });

    test('detects packageManager field from parent directory in hierarchy', async () => {
      (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
        if (executable === 'pnpm') return '/path/to/pnpm';
        return undefined;
      });

      // subdir has package.json but no packageManager field
      // parent directory has packageManager: pnpm@10.17.0
      const testDirectory = path.join(baseDirectory, 'packageManager-hierarchy', 'subdir');

      const packageManager = await getPackageManager(testDirectory);

      expect(packageManager).toBeDefined();
      expect(packageManager!.packageManager).toEqual('pnpm');
    });

    test('packageManager field takes precedence over lock files', async () => {
      (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
        if (executable === 'pnpm') return '/path/to/pnpm';
        if (executable === 'yarn') return '/path/to/yarn';
        return undefined;
      });

      // Directory has yarn.lock but package.json has packageManager: pnpm@10.17.0
      const testDirectory = path.join(baseDirectory, 'packageManager-field-with-lockfile');

      const packageManager = await getPackageManager(testDirectory);

      expect(packageManager).toBeDefined();
      expect(packageManager!.packageManager).toEqual('pnpm');
    });

    test('falls back to lock file detection when packageManager executable not found', async () => {
      (which_mock.sync as jest.Mock).mockImplementation((executable: string) => {
        // pnpm not in PATH, but yarn is
        if (executable === 'pnpm') return undefined;
        if (executable === 'yarn') return '/path/to/yarn';
        return undefined;
      });

      // Parent directory has packageManager: pnpm but pnpm not in PATH
      // Subdirectory has yarn.lock (no packageManager field to avoid corepack blocking yarn)
      // yarn is in PATH, so should fall back to yarn via lock file
      const testDirectory = path.join(baseDirectory, 'packageManager-hierarchy-fallback', 'subdir');

      const packageManager = await getPackageManager(testDirectory);

      expect(packageManager).toBeDefined();
      expect(packageManager!.packageManager).toEqual('yarn');
    });
  });
});
