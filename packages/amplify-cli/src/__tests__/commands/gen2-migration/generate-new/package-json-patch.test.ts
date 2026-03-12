import { patchNpmPackageJson, PackageJson } from '../../../../commands/gen2-migration/generate-new/package-json-patch';

describe('patchNpmPackageJson', () => {
  it('adds Gen2 dev dependencies to an empty package.json', () => {
    const input: PackageJson = { name: 'test-app' };
    const result = patchNpmPackageJson(input);

    expect(result.devDependencies).toBeDefined();
    expect(result.devDependencies!['@aws-amplify/backend']).toBe('*');
    expect(result.devDependencies!['@aws-amplify/backend-cli']).toBe('*');
    expect(result.devDependencies!['aws-cdk']).toBe('*');
    expect(result.devDependencies!['aws-cdk-lib']).toBe('*');
    expect(result.devDependencies!['constructs']).toBe('*');
    expect(result.devDependencies!['esbuild']).toBe('*');
    expect(result.devDependencies!['tsx']).toBe('*');
  });

  it('uses provided version overrides', () => {
    const input: PackageJson = { name: 'test-app' };
    const result = patchNpmPackageJson(input, {
      '@aws-amplify/backend': '^1.18.0',
      'aws-cdk-lib': '^2',
    });

    expect(result.devDependencies!['@aws-amplify/backend']).toBe('^1.18.0');
    expect(result.devDependencies!['aws-cdk-lib']).toBe('^2');
  });

  it('preserves existing dependencies', () => {
    const input: PackageJson = {
      name: 'test-app',
      dependencies: { react: '^18.0.0' },
      devDependencies: { typescript: '^5.0.0' },
    };
    const result = patchNpmPackageJson(input);

    expect(result.dependencies!['react']).toBe('^18.0.0');
    expect(result.devDependencies!['typescript']).toBe('^5.0.0');
  });

  it('preserves existing fields like name and scripts', () => {
    const input: PackageJson = {
      name: 'my-app',
      scripts: { build: 'tsc' },
    };
    const result = patchNpmPackageJson(input);

    expect(result.name).toBe('my-app');
    expect(result.scripts).toEqual({ build: 'tsc' });
  });

  it('sorts dependency keys alphabetically', () => {
    const input: PackageJson = {
      name: 'test-app',
      devDependencies: { 'z-package': '1.0.0', 'a-package': '2.0.0' },
    };
    const result = patchNpmPackageJson(input);
    const keys = Object.keys(result.devDependencies!);

    for (let i = 1; i < keys.length; i++) {
      expect(keys[i].localeCompare(keys[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });
});
