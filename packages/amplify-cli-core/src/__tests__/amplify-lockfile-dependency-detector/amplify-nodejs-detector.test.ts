import * as path from 'path';
import { AmplifyNodePkgDetectorProps, AmplifyNodePkgDetector } from '../../amplify-node-pkg-detector';
import { getPackageManager } from '../../utils/packageManager';

jest.mock('../../utils/packageManager');

describe('no package Manager cases', () => {
  it('error thrown when no package manager found', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue(null);
    const projectRoot = path.join(__dirname, 'resources');
    expect(
      () => new AmplifyNodePkgDetector({
        projectRoot,
        dependencyToSearch: '@aws-cdk/core',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`"No package manager found."`);
  });
});

describe('parsing yarn lock files', () => {
  it('throws error when lock file not found', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-test-not-found.lock',
      packageManager: 'yarn',
    });
    const projectRoot = path.join(__dirname, 'resources');
    expect(
      () => new AmplifyNodePkgDetector({
        projectRoot,
        dependencyToSearch: '@aws-cdk/core',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`"Lockfile not found at location: \${lockFileFullPath}"`);
  });
  it('parses yarn lock file correctly', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-test.lock',
      packageManager: 'yarn',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
    });
    expect(dec.parseLockFile()).toMatchSnapshot();
  });

  it('throw error on corrupted lock file', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-test-error.lock',
      packageManager: 'yarn',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const amplifyDetectorProps: AmplifyNodePkgDetectorProps = {
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
    };
    expect(() => new AmplifyNodePkgDetector(amplifyDetectorProps).parseLockFile()).toThrowErrorMatchingInlineSnapshot(
      `"yarn.lock parsing failed with an error: Invalid value type 1:16 in lockfile"`,
    );
  });

  it('correctly detect dependencies for @aws-cdk/core', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-test.lock',
      packageManager: 'yarn',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
    });
    expect(dec.detectAffectedDirectDependencies()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "amplify-cli-core",
        },
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "@aws-amplify/amplify-category-custom",
        },
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "@aws-amplify/cli-extensibility-helper",
        },
      ]
    `);
  });
  it('correctly detect dependencies for amplify-cli-core', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-test.lock',
      packageManager: 'yarn',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: 'amplify-cli-core',
    });
    expect(dec.detectAffectedDirectDependencies()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "3.4.0",
          },
          "packageName": "@aws-amplify/amplify-category-custom",
        },
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "3.4.0",
          },
          "packageName": "@aws-amplify/cli-extensibility-helper",
        },
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "3.4.0",
          },
          "packageName": "amplify-cli-core",
        },
      ]
    `);
  });

  it('correctly detect dependencies for fs-extra', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-test.lock',
      packageManager: 'yarn',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: 'fs-extra',
    });
    expect(dec.detectAffectedDirectDependencies()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "9.1.0",
          },
          "packageName": "amplify-cli-core",
        },
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "9.1.0",
          },
          "packageName": "@aws-amplify/amplify-category-custom",
        },
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "9.1.0",
          },
          "packageName": "@aws-amplify/cli-extensibility-helper",
        },
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "9.1.0",
          },
          "packageName": "fs-extra",
        },
      ]
    `);
  });

  it('correctly detect dependencies for aws-cdk-lib', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-test.lock',
      packageManager: 'yarn',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: 'aws-cdk-lib',
    });
    expect(dec.detectAffectedDirectDependencies()).toMatchInlineSnapshot(`undefined`);
  });
});

describe('parsing package lock files', () => {
  it('throws error when package lock file is missing', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-not-found.json',
      packageManager: 'yarn',
    });
    const projectRoot = path.join(__dirname, 'resources');
    expect(
      () => new AmplifyNodePkgDetector({
        projectRoot,
        dependencyToSearch: '@aws-cdk/core',
      }),
    ).toThrowErrorMatchingInlineSnapshot(`"Lockfile not found at location: \${lockFileFullPath}"`);
  });
  it('parses package lock file correctly', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-test.json',
      packageManager: 'npm',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
    });
    expect(dec.parseLockFile()).toMatchSnapshot();
  });

  it('throw error on corrupted package lock file', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-test-error.json',
      packageManager: 'npm',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const amplifyDetectorProps: AmplifyNodePkgDetectorProps = {
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
    };
    expect(() => new AmplifyNodePkgDetector(amplifyDetectorProps).parseLockFile()).toThrowErrorMatchingInlineSnapshot(
      `"package-lock.json parsing failed with an error: 'jsonString' argument missing or empty"`,
    );
  });

  it('correctly detect dependencies', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-test.json',
      packageManager: 'npm',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
    });
    expect(dec.detectAffectedDirectDependencies()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "amplify-cli-core",
        },
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "@aws-amplify/amplify-category-custom",
        },
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "@aws-amplify/cli-extensibility-helper",
        },
      ]
    `);
  });
  it('correctly detect dependencies for amplify-cli-core', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-test.json',
      packageManager: 'npm',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: 'amplify-cli-core',
    });
    expect(dec.detectAffectedDirectDependencies()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "2.12.0",
          },
          "packageName": "@aws-amplify/amplify-category-custom",
        },
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "2.12.0",
          },
          "packageName": "@aws-amplify/cli-extensibility-helper",
        },
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "2.12.0",
          },
          "packageName": "amplify-cli-core",
        },
      ]
    `);
  });

  it('correctly detect dependencies for fs-extra', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-test.json',
      packageManager: 'npm',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: 'fs-extra',
    });
    expect(dec.detectAffectedDirectDependencies()).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "8.1.0",
          },
          "packageName": "amplify-cli-core",
        },
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "8.1.0",
          },
          "packageName": "@aws-amplify/amplify-category-custom",
        },
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "8.1.0",
          },
          "packageName": "@aws-amplify/cli-extensibility-helper",
        },
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "8.1.0",
          },
          "packageName": "fs-extra",
        },
      ]
    `);
  });

  it('correctly detect dependencies for aws-cdk-lib', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-test.json',
      packageManager: 'npm',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: 'aws-cdk-lib',
    });
    expect(dec.detectAffectedDirectDependencies()).toMatchInlineSnapshot(`undefined`);
  });
});
