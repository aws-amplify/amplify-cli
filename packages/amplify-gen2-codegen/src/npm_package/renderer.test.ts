import { AmplifyDependencies, AmplifyDevDependencies, AmplifyPackageVersions, PackageJson, patchNpmPackageJson } from './renderer';
import assert from 'node:assert';
const createPackageJson = (): PackageJson => ({
  name: 'my-package',
  scripts: {
    test: 'echo "hello, world"',
  },
  dependencies: {
    'existing-dependency': '^0.0.1',
  },
  devDependencies: {
    'existing-dev-dependency': '^0.0.2',
  },
});
type IsDevDependency = boolean;
const installedDependencies: Record<keyof AmplifyPackageVersions, IsDevDependency> = {
  tsx: true,
  'aws-cdk': true,
  'aws-amplify': false,
  esbuild: true,
  constructs: true,
  typescript: true,
  'aws-cdk-lib': true,
  '@aws-amplify/backend': true,
  '@aws-amplify/backend-cli': true,
  'ci-info': true,
  '@types/node': true
};

describe('package.json renderer', () => {
  describe('package versions', () => {
    it('preserves existing dependencies', () => {
      const examplePackageJson = createPackageJson();
      const packageJson = patchNpmPackageJson(examplePackageJson, {});
      assert.equal(packageJson.dependencies?.['existing-dependency'], '^0.0.1');
    });
    it('preserves existing dev dependencies', () => {
      const examplePackageJson = createPackageJson();
      const packageJson = patchNpmPackageJson(examplePackageJson, {});
      assert.equal(packageJson.devDependencies?.['existing-dev-dependency'], '^0.0.2');
    });
    describe('when a version is defined', () => {
      for (const [dependency, isDevDependency] of Object.entries(installedDependencies)) {
        it(`sets the version of ${dependency} to the defined version`, () => {
          const examplePackageJson = createPackageJson();
          const version = '1.1.1';
          const packageJson = patchNpmPackageJson(examplePackageJson, {
            [dependency]: version,
          });
          if (isDevDependency) {
            const typedDependencyKey = dependency as keyof AmplifyDevDependencies;
            assert.equal(packageJson.devDependencies?.[typedDependencyKey], version);
          } else {
            const typedDependencyKey = dependency as keyof AmplifyDependencies;
            assert.equal(packageJson.dependencies?.[typedDependencyKey], version);
          }
        });
      }
    });
    describe('when a version is not defined', () => {
      for (const [dependency, isDevDependency] of Object.entries(installedDependencies)) {
        it(`sets the version of ${dependency} to *`, () => {
          const examplePackageJson = createPackageJson();
          const packageJson = patchNpmPackageJson(examplePackageJson, {});
          if (isDevDependency) {
            const typedDependencyKey = dependency as keyof AmplifyDevDependencies;
            assert.equal(packageJson.devDependencies?.[typedDependencyKey], '*');
          } else {
            const typedDependencyKey = dependency as keyof AmplifyDependencies;
            assert.equal(packageJson.dependencies?.[typedDependencyKey], '*');
          }
        });
      }
    });
  });
  describe('package name', () => {
    it('is not overwritten ', async () => {
      const examplePackageJson = {
        name: 'my-gen2-app',
      };
      const packageJson = patchNpmPackageJson(examplePackageJson, {});
      assert.equal(packageJson.name, 'my-gen2-app');
    });
  });
});
