import * as path from 'path';
import which from 'which';
import { getPackageManager } from '../utils';

jest.mock('which');

describe('packageManager tests', () => {
  const baseDirectory = path.join(__dirname, 'testFiles');
  const which_mock = which as jest.Mocked<typeof which>;

  beforeEach(() => jest.clearAllMocks());

  test('returns null when no package.json found', async () => {
    const testDirectory = path.join(baseDirectory, 'packageManager-null');

    const packageManager = await getPackageManager(testDirectory);

    expect(packageManager).toBeNull();
  });

  test('detects yarn2 correctly', async () => {
    which_mock.sync.mockReturnValue('/path/to/yarn');

    const testDirectory = path.join(baseDirectory, 'packageManager-yarn2');

    const packageManager = await getPackageManager(testDirectory);

    expect(which_mock.sync).toBeCalledTimes(1);
    expect(packageManager).toBeDefined();
    expect(packageManager?.packageManager).toEqual('yarn');
    expect(packageManager?.version?.major).toBeGreaterThanOrEqual(2);
  });

  test('detects yarn correctly', async () => {
    which_mock.sync.mockReturnValue('/path/to/yarn');

    const testDirectory = path.join(baseDirectory, 'packageManager-yarn');

    const packageManager = await getPackageManager(testDirectory);

    expect(which_mock.sync).toBeCalledTimes(1);
    expect(packageManager).toBeDefined();
    expect(packageManager!.packageManager).toEqual('yarn');
  });

  test('detects npm correctly', async () => {
    const testDirectory = path.join(baseDirectory, 'packageManager-npm');

    const packageManager = await getPackageManager(testDirectory);

    expect(packageManager).toBeDefined();
    expect(packageManager!.packageManager).toEqual('npm');
  });

  test('detects yarn fallback correctly when yarn in path', async () => {
    which_mock.sync.mockReturnValue('/path/to/yarn');

    const testDirectory = path.join(baseDirectory, 'packageManager-fallback');

    const packageManager = await getPackageManager(testDirectory);

    expect(which_mock.sync).toBeCalledTimes(1);
    expect(packageManager).toBeDefined();
    expect(packageManager!.packageManager).toEqual('yarn');
  });

  test('detects npm fallback correctly when yarn is not in path', async () => {
    (which_mock.sync as any).mockReturnValue(undefined);

    const testDirectory = path.join(baseDirectory, 'packageManager-fallback');

    const packageManager = await getPackageManager(testDirectory);

    expect(which_mock.sync).toBeCalledTimes(2);
    expect(packageManager).toBeDefined();
    expect(packageManager!.packageManager).toEqual('npm');
  });
});
