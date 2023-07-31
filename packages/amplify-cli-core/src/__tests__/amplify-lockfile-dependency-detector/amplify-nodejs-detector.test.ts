import * as path from 'path';
import { AmplifyNodePkgDetectorProps, AmplifyNodePkgDetector } from '../../amplify-node-pkg-detector';
import { getPackageManager, getPackageManagerByType } from '../../utils/packageManager';
import { coerce } from 'semver';
import { $TSAny } from '@aws-amplify/amplify-cli-core';

jest.mock('../../utils/packageManager', () => ({
  ...(jest.requireActual('../../utils/packageManager') as {}),
  getPackageManager: jest.fn(),
}));

describe('no package Manager cases', () => {
  it('error thrown when no package manager found', async () => {
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue(new Promise((resolve) => resolve(null)));
    const projectRoot = path.join(__dirname, 'resources');
    await expect(
      async () =>
        await AmplifyNodePkgDetector.getInstance({
          projectRoot,
        }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"No package manager found."`);
  });
});

const yarnPackageManager = getPackageManagerByType('yarn');
const npmPackageManager = getPackageManagerByType('npm');

describe('parsing yarn lock files', () => {
  it('throws error when lock file not found', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-test-not-found.lock';

    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    await expect(
      async () =>
        await AmplifyNodePkgDetector.getInstance({
          projectRoot,
        }),
    ).rejects.toThrowError();
  });

  it('throw error on corrupted lock file', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-test-error.lock';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const amplifyDetectorProps: AmplifyNodePkgDetectorProps = {
      projectRoot,
    };
    await expect(async () =>
      (await AmplifyNodePkgDetector.getInstance(amplifyDetectorProps)).detectAffectedDirectDependencies('@aws-cdk/core'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"yarn.lock parsing failed with an error: Invalid value type 1:16 in lockfile"`);
  });

  it('correctly detect dependencies for @aws-cdk/core', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-test.lock';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "amplify-cli-core",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-cdk/core",
  },
]
`);
  });
  it('correctly detect dependencies for amplify-cli-core', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-test.lock';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('amplify-cli-core')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "3.4.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "3.4.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "3.4.0",
    },
    "packageName": "amplify-cli-core",
  },
]
`);
  });

  it('correctly detect dependencies for fs-extra', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-test.lock';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('fs-extra')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "9.1.0",
    },
    "packageName": "@aws-cdk/core",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "9.1.0",
    },
    "packageName": "amplify-cli-core",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "9.1.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "9.1.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "9.1.0",
    },
    "packageName": "fs-extra",
  },
]
`);
  });

  it('correctly detect dependencies for aws-cdk-lib', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-test.lock';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('aws-cdk-lib')).toMatchInlineSnapshot(`[]`);
  });

  it('should handle cycle in graph with yarn 1', async () => {
    // this test will error with stack overflow if dfs is following cycle
    (yarnPackageManager as $TSAny).lockFile = 'yarn-test-with-cycle.lock';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    dec.detectAffectedDirectDependencies('@aws-cdk/core');
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`[]`);
  });
});

describe('parsing package lock files', () => {
  it('throws error when package lock file is missing', async () => {
    (npmPackageManager as $TSAny).lockFile = 'package-lock-not-found.json';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    await expect(
      async () =>
        await AmplifyNodePkgDetector.getInstance({
          projectRoot,
        }),
    ).rejects.toThrowError();
  });

  it('throw error on corrupted package lock file', async () => {
    (npmPackageManager as $TSAny).lockFile = 'package-lock-test-error.json';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const amplifyDetectorProps: AmplifyNodePkgDetectorProps = {
      projectRoot,
    };
    await expect(async () =>
      (await AmplifyNodePkgDetector.getInstance(amplifyDetectorProps)).detectAffectedDirectDependencies('@aws-cdk/core'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"package-lock.json parsing failed with an error: 'jsonString' argument missing or empty"`,
    );
  });

  it('correctly detect dependencies', async () => {
    (npmPackageManager as $TSAny).lockFile = 'package-lock-test.json';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "amplify-cli-core",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-cdk/core",
  },
]
`);
  });

  it('correctly detect dependencies for @aws-cdk/core when present in peer dependencies', async () => {
    (npmPackageManager as $TSAny).lockFile = 'package-lock-test-peer-dependencies.json';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.188.0",
    },
    "packageName": "@aws-cdk/core",
  },
]
`);
  });
  it('correctly detect dependencies for amplify-cli-core', async () => {
    (npmPackageManager as $TSAny).lockFile = 'package-lock-test.json';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('amplify-cli-core')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "2.12.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "2.12.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "2.12.0",
    },
    "packageName": "amplify-cli-core",
  },
]
`);
  });

  it('correctly detect dependencies for fs-extra', async () => {
    (npmPackageManager as $TSAny).lockFile = 'package-lock-test.json';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('fs-extra')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "8.1.0",
    },
    "packageName": "@aws-cdk/core",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "8.1.0",
    },
    "packageName": "amplify-cli-core",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "8.1.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "8.1.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "8.1.0",
    },
    "packageName": "fs-extra",
  },
]
`);
  });

  it('correctly detect dependencies for aws-cdk-lib', async () => {
    (npmPackageManager as $TSAny).lockFile = 'package-lock-test.json';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('aws-cdk-lib')).toMatchInlineSnapshot(`[]`);
  });

  it('should handle cycle in graph with npm', async () => {
    (npmPackageManager as $TSAny).lockFile = 'package-lock-test-with-cycle.json';
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(npmPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`[]`);
  });
});

describe('parsing yarn2 lock files', () => {
  it('throw error on corrupted lock file', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-2-test.lock';
    yarnPackageManager.version = coerce('1.22.0') ?? undefined;
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const amplifyDetectorProps: AmplifyNodePkgDetectorProps = {
      projectRoot,
    };
    await expect(async () =>
      (await AmplifyNodePkgDetector.getInstance(amplifyDetectorProps)).detectAffectedDirectDependencies('@aws-cdk/core'),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"yarn.lock parsing failed with an error: Unknown token: { line: 3, col: 2, type: 'INVALID', value: undefined } 3:2 in lockfile"`,
    );
  });

  it('correctly detect dependencies for @aws-cdk/core', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-2-test.lock';
    yarnPackageManager.version = coerce('2.0.0') ?? undefined;
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('@aws-cdk/core')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "amplify-cli-core",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "@aws-cdk/core",
      "version": "1.172.0",
    },
    "packageName": "@aws-cdk/core",
  },
]
`);
  });

  it('correctly detect dependencies for amplify-cli-core', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-2-test.lock';
    yarnPackageManager.version = coerce('2.0.0') ?? undefined;
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('amplify-cli-core')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "3.5.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "3.5.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "amplify-cli-core",
      "version": "3.5.0",
    },
    "packageName": "amplify-cli-core",
  },
]
`);
  });

  it('correctly detect dependencies for fs-extra', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-2-test.lock';
    yarnPackageManager.version = coerce('2.0.0') ?? undefined;
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('fs-extra')).toMatchInlineSnapshot(`
[
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "9.1.0",
    },
    "packageName": "@aws-cdk/core",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "9.1.0",
    },
    "packageName": "amplify-cli-core",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "8.1.0",
    },
    "packageName": "@aws-amplify/amplify-category-custom",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "8.1.0",
    },
    "packageName": "@aws-amplify/cli-extensibility-helper",
  },
  {
    "dependentPackage": {
      "name": "fs-extra",
      "version": "9.1.0",
    },
    "packageName": "fs-extra",
  },
]
`);
  });

  it('correctly detect dependencies for aws-cdk-lib', async () => {
    (yarnPackageManager as $TSAny).lockFile = 'yarn-2-test.lock';
    yarnPackageManager.version = coerce('2.0.0') ?? undefined;
    (getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockResolvedValue(yarnPackageManager);
    const projectRoot = path.join(__dirname, 'resources');
    const dec = await AmplifyNodePkgDetector.getInstance({
      projectRoot,
    });
    expect(dec.detectAffectedDirectDependencies('aws-cdk-lib')).toMatchInlineSnapshot(`[]`);
  });
});
