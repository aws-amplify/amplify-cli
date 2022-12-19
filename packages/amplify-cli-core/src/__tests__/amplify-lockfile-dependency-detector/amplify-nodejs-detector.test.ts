import * as path from 'path';
import { AmplifyNodeJsDetectorProps, AmplifyNodePkgDetector } from '../../amplify-lockfile-dependency-detector';

describe.skip('parsing yarn lock files', () => {
  it('parses yarn lock file correctly', async () => {
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
      dependencyVersion: '~1.172.0',
      packageManager: {
        executable: 'yarn',
        lockFile: 'yarn-test.lock',
        packageManager: 'yarn',
      },
    });
    expect(dec.parseLockFile()).toMatchSnapshot();
  });

  it('throw error on corrupted lock file', async () => {
    const projectRoot = path.join(__dirname, 'resources');
    const amplifyDetectorProps: AmplifyNodeJsDetectorProps = {
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
      dependencyVersion: '~1.172.0',
      packageManager: {
        executable: 'yarn',
        lockFile: 'yarn-test-error.lock',
        packageManager: 'yarn',
      },
    };
    expect(() => new AmplifyNodePkgDetector(amplifyDetectorProps).parseLockFile()).toThrowErrorMatchingInlineSnapshot(
      `"yarn.lock parsing failed with an error: Invalid value type 1:16 in lockfile"`,
    );
  });

  it('correctly detect dependencies', async () => {
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
      dependencyVersion: '~1.172.0',
      packageManager: {
        executable: 'yarn',
        lockFile: 'yarn-test.lock',
        packageManager: 'yarn',
      },
    });
    expect(dec.getDependentPackage('@aws-amplify/amplify-category-custom')).toMatchInlineSnapshot(`
      Object {
        "dependencies": Object {
          "@aws-cdk/cloud-assembly-schema": "1.172.0",
          "@aws-cdk/cx-api": "1.172.0",
          "@aws-cdk/region-info": "1.172.0",
          "@balena/dockerignore": "^1.0.2",
          "constructs": "^3.3.69",
          "fs-extra": "^9.1.0",
          "ignore": "^5.2.0",
          "minimatch": "^3.1.2",
        },
        "integrity": "sha512-Hy7jNNzkNSf+oCmhhXnTcybunejTtCuGmfEFNZXsizcWBUjm0zD0K1X3kjD7Fqs0p+4xbaorCTgIB3Cu9qrF1Q==",
        "resolved": "https://registry.npmjs.org/@aws-cdk/core/-/core-1.172.0.tgz#f47bdbd71648d45900780257ee62276ddbc9b0d5",
        "version": "1.172.0",
      }
    `);

    expect(dec.getDependentPackage('@aws-amplify/cli-extensibility-helper')).toMatchInlineSnapshot(`
          Object {
            "dependencies": Object {
              "@aws-cdk/cloud-assembly-schema": "1.172.0",
              "@aws-cdk/cx-api": "1.172.0",
              "@aws-cdk/region-info": "1.172.0",
              "@balena/dockerignore": "^1.0.2",
              "constructs": "^3.3.69",
              "fs-extra": "^9.1.0",
              "ignore": "^5.2.0",
              "minimatch": "^3.1.2",
            },
            "integrity": "sha512-Hy7jNNzkNSf+oCmhhXnTcybunejTtCuGmfEFNZXsizcWBUjm0zD0K1X3kjD7Fqs0p+4xbaorCTgIB3Cu9qrF1Q==",
            "resolved": "https://registry.npmjs.org/@aws-cdk/core/-/core-1.172.0.tgz#f47bdbd71648d45900780257ee62276ddbc9b0d5",
            "version": "1.172.0",
          }
      `);

    expect(dec.getDependentPackage('amplify-cli-core')).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "@aws-cdk/cloud-assembly-schema": "1.172.0",
            "@aws-cdk/cx-api": "1.172.0",
            "@aws-cdk/region-info": "1.172.0",
            "@balena/dockerignore": "^1.0.2",
            "constructs": "^3.3.69",
            "fs-extra": "^9.1.0",
            "ignore": "^5.2.0",
            "minimatch": "^3.1.2",
          },
          "integrity": "sha512-Hy7jNNzkNSf+oCmhhXnTcybunejTtCuGmfEFNZXsizcWBUjm0zD0K1X3kjD7Fqs0p+4xbaorCTgIB3Cu9qrF1Q==",
          "resolved": "https://registry.npmjs.org/@aws-cdk/core/-/core-1.172.0.tgz#f47bdbd71648d45900780257ee62276ddbc9b0d5",
          "version": "1.172.0",
        }
    `);

    expect(dec.getDependentPackage('fs-extra')).toMatchInlineSnapshot(`undefined`);
  });
});

describe('parsing package lock files', () => {
  it.skip('parses package lock file correctly', async () => {
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
      dependencyVersion: '~1.172.0',
      packageManager: {
        executable: 'npm',
        lockFile: 'package-lock-test.json',
        packageManager: 'npm',
      },
    });
    expect(dec.parseLockFile()).toMatchSnapshot();
  });

  it.skip('throw error on corrupted package lock file', async () => {
    const projectRoot = path.join(__dirname, 'resources');
    const amplifyDetectorProps: AmplifyNodeJsDetectorProps = {
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
      dependencyVersion: '~1.172.0',
      packageManager: {
        executable: 'npm',
        lockFile: 'package-lock-test-error.json',
        packageManager: 'npm',
      },
    };
    expect(() => new AmplifyNodePkgDetector(amplifyDetectorProps).parseLockFile()).toThrowErrorMatchingInlineSnapshot(
      `"package-lock.json parsing failed with error 'jsonString' argument missing or empty"`,
    );
  });

  it.skip('correctly detect dependencies', async () => {
    const projectRoot = path.join(__dirname, 'resources');
    const dec = new AmplifyNodePkgDetector({
      projectRoot,
      dependencyToSearch: '@aws-cdk/core',
      dependencyVersion: '~1.172.0',
      packageManager: {
        executable: 'npm',
        lockFile: 'package-lock-test.json',
        packageManager: 'npm',
      },
    });
    expect(dec.getDependentPackage('@aws-amplify/cli-extensibility-helper')).toMatchInlineSnapshot(`
      Object {
        "dependencies": Object {
          "@aws-cdk/cloud-assembly-schema": "1.172.0",
          "@aws-cdk/cx-api": "1.172.0",
          "@aws-cdk/region-info": "1.172.0",
          "@balena/dockerignore": "^1.0.2",
          "constructs": "^3.3.69",
          "fs-extra": "^9.1.0",
          "ignore": "^5.2.0",
          "minimatch": "^3.1.2",
        },
        "integrity": "sha512-Hy7jNNzkNSf+oCmhhXnTcybunejTtCuGmfEFNZXsizcWBUjm0zD0K1X3kjD7Fqs0p+4xbaorCTgIB3Cu9qrF1Q==",
        "resolved": "https://registry.npmjs.org/@aws-cdk/core/-/core-1.172.0.tgz#f47bdbd71648d45900780257ee62276ddbc9b0d5",
        "version": "1.172.0",
      }
    `);
  });
});
