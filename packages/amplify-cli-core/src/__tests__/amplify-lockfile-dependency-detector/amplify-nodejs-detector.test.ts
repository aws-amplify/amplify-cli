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
      }),
    ).toThrowError();
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
    };
    expect(() => new AmplifyNodePkgDetector(amplifyDetectorProps).detectAffectedDirectDependencies('@aws-cdk/core')).toThrowErrorMatchingInlineSnapshot(
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
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`
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
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "@aws-cdk/core",
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
    });
    expect(dec.detectAffectedDirectDependencies('amplify-cli-core')).toMatchInlineSnapshot(`
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
    });
    expect(dec.detectAffectedDirectDependencies('fs-extra')).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "9.1.0",
          },
          "packageName": "@aws-cdk/core",
        },
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
    });
    expect(dec.detectAffectedDirectDependencies('aws-cdk-lib')).toMatchInlineSnapshot(`Array []`);
  });
});

describe('parsing package lock files', () => {
  it('throws error when package lock file is missing', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-not-found.json',
      packageManager: 'npm',
    });
    const projectRoot = path.join(__dirname, 'resources');
    expect(
      () => new AmplifyNodePkgDetector({
        projectRoot,
      }),
    ).toThrowError();
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
    };
    expect(() => new AmplifyNodePkgDetector(amplifyDetectorProps).detectAffectedDirectDependencies('@aws-cdk/core')).toThrowErrorMatchingInlineSnapshot(
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
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`
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
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "@aws-cdk/core",
        },
      ]
    `);
  });

  it('correctly detect dependencies for @aws-cdk/core when present in peer dependencies', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'npm',
      lockFile: 'package-lock-test-peer-dependencies.json',
      packageManager: 'npm',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.188.0",
          },
          "packageName": "@aws-cdk/core",
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
    });
    expect(dec.detectAffectedDirectDependencies('amplify-cli-core')).toMatchInlineSnapshot(`
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
    });
    expect(dec.detectAffectedDirectDependencies('fs-extra')).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "8.1.0",
          },
          "packageName": "@aws-cdk/core",
        },
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
    });
    expect(dec.detectAffectedDirectDependencies('aws-cdk-lib')).toMatchInlineSnapshot(`Array []`);
  });
});

describe('parsing yarn2 lock files', () => {
  it('throw error on corrupted lock file', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-test-error.lock',
      packageManager: 'yarn2',
      yarnrcPath: '.yarnrc.yml',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const amplifyDetectorProps: AmplifyNodePkgDetectorProps = {
      projectRoot,
    };
    expect(() => new AmplifyNodePkgDetector(amplifyDetectorProps).detectAffectedDirectDependencies('@aws-cdk/core')).toThrowErrorMatchingInlineSnapshot(
      `"yarn.lock parsing failed"`,
    );
  });

  it('correctly detect dependencies for @aws-cdk/core', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-2-test.lock',
      packageManager: 'yarn2',
      yarnrcPath: '.yarnrc.yml',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`
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
        Object {
          "dependentPackage": Object {
            "name": "@aws-cdk/core",
            "version": "1.172.0",
          },
          "packageName": "@aws-cdk/core",
        },
      ]
    `);
  });

  it('correctly detect dependencies for amplify-cli-core', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-2-test.lock',
      packageManager: 'yarn2',
      yarnrcPath: '.yarnrc.yml',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('amplify-cli-core')).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "3.5.0",
          },
          "packageName": "@aws-amplify/amplify-category-custom",
        },
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "3.5.0",
          },
          "packageName": "@aws-amplify/cli-extensibility-helper",
        },
        Object {
          "dependentPackage": Object {
            "name": "amplify-cli-core",
            "version": "3.5.0",
          },
          "packageName": "amplify-cli-core",
        },
      ]
    `);
  });

  it('correctly detect dependencies for fs-extra', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
      executable: 'yarn',
      lockFile: 'yarn-2-test.lock',
      packageManager: 'yarn2',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('fs-extra')).toMatchInlineSnapshot(`
      Array [
        Object {
          "dependentPackage": Object {
            "name": "fs-extra",
            "version": "9.1.0",
          },
          "packageName": "@aws-cdk/core",
        },
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
      lockFile: 'yarn-2-test.lock',
      packageManager: 'yarn2',
      yarnrcPath: '.yarnrc.yml',
    });
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('aws-cdk-lib')).toMatchInlineSnapshot(`Array []`);
  });
});
