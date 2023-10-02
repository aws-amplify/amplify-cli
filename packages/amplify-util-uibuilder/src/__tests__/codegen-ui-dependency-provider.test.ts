import semver from 'semver';
import { ReactRequiredDependencyProvider } from '../commands/utils/codegen-ui-dependency-provider';

describe('ReactStudioDependencyProvider', () => {
  const requiredDependencies = new ReactRequiredDependencyProvider().getRequiredDependencies(false);
  const requiredDependenciesWithStorageManager = new ReactRequiredDependencyProvider().getRequiredDependencies(true);

  describe('getRequiredDependencies', () => {
    it('has required dependencies', () => {
      expect(requiredDependencies.length).toBeGreaterThan(0);
    });

    it('includes ui-react', () => {
      expect(requiredDependencies.filter((dep) => dep.dependencyName === '@aws-amplify/ui-react')).toBeTruthy();
    });

    it('includes all valid semver values', () => {
      requiredDependencies.forEach((dep) => {
        expect(semver.valid(dep.supportedSemVerPattern)).toBeDefined();
      });
    });

    it('includes reasons on all dependencies', () => {
      requiredDependencies.forEach((dep) => {
        expect(dep.reason.length).toBeGreaterThan(0);
      });
    });

    it('does not include ui-react-storage if user does not use StorageManager', () => {
      expect(requiredDependencies.filter((dep) => dep.dependencyName !== '@aws-amplify/ui-react-storage')).toBeTruthy();
    });

    it('includes ui-react-storage if user is using StorageManager', () => {
      expect(requiredDependenciesWithStorageManager.filter((dep) => dep.dependencyName === '@aws-amplify/ui-react-storage')).toBeTruthy();
    });
  });
});
