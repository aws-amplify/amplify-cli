import * as path from 'path';
import * as fs from 'fs-extra';
import { pathManager } from '../state-manager';

jest.mock('fs-extra');

describe('test getAmplifyPackageLibDirPath', () => {
  const scopedPackageName = '@aws-amplify/amplify-opensearch-simulator';
  const nonScopedPackageName = 'amplify-opensearch-simulator';
  const expectedDescopedName = 'aws-amplify-amplify-opensearch-simulator';

  it('should return descoped path for scoped packages', () => {
    jest.spyOn(fs, 'pathExistsSync').mockReturnValueOnce(true);

    const expectedPath = path.join(pathManager.getAmplifyLibRoot(), expectedDescopedName);
    expect(pathManager.getAmplifyPackageLibDirPath(scopedPackageName)).toEqual(expectedPath);
  });

  it('should return correct path for non-scoped packages', () => {
    jest.spyOn(fs, 'pathExistsSync').mockReturnValueOnce(true);

    const expectedPath = path.join(pathManager.getAmplifyLibRoot(), nonScopedPackageName);
    expect(pathManager.getAmplifyPackageLibDirPath(nonScopedPackageName)).toEqual(expectedPath);
  });

  it('throws error if path does not exist for scoped packages', () => {
    jest.spyOn(fs, 'pathExistsSync').mockReturnValueOnce(false);

    const expectedPath = path.join(pathManager.getAmplifyLibRoot(), expectedDescopedName);
    try {
      pathManager.getAmplifyPackageLibDirPath(scopedPackageName);
    } catch (err) {
      expect(err?.message).toEqual(`Package lib at ${expectedPath} does not exist.`);
    }
  });

  it('throws error if path does not exist for scoped packages', () => {
    jest.spyOn(fs, 'pathExistsSync').mockReturnValueOnce(false);

    const expectedPath = path.join(pathManager.getAmplifyLibRoot(), nonScopedPackageName);
    try {
      pathManager.getAmplifyPackageLibDirPath(nonScopedPackageName);
    } catch (err) {
      expect(err?.message).toEqual(`Package lib at ${expectedPath} does not exist.`);
    }
  });
});

describe('test getStackBuildCategoryResourceDirPath', () => {
  const category = 'storage';
  const resourceName = 'testResource';
  const expectedPath = path.join(pathManager.getRootStackBuildDirPath('projectPath'), category, resourceName);

  it('should return correct path', () => {
    expect(pathManager.getStackBuildCategoryResourceDirPath('projectPath', category, resourceName)).toEqual(expectedPath);
  });
});
