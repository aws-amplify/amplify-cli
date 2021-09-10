import * as aws from 'aws-sdk';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as which from 'which';
import CloudFormation from 'aws-sdk/clients/cloudformation';
import _ from 'lodash';
import { JSONUtilities, stateManager } from 'amplify-cli-core';
import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getCLIPath,
  initJSProjectWithProfile,
  nspawn as spawn,
  isCI,
} from 'amplify-e2e-core';

type VersionGatingMetadata = {
  DeployedByCLIVersion?: string;
  MinimumCompatibleCLIVersion?: string;
};

describe('version gating', () => {
  let projRoot: string;
  let projectInitialized = false;
  const projName = 'versiongating';

  // Extreme version numbers for testing purposes
  const baseCLIVersion = '100.0.0';
  const baseMinimumCLIVersion = '100.0.0';

  let cliPath: string;
  let packageJsonPath: string;
  let originalPackageJsonContent: string;
  let packageJson: { version: string; 'amplify-cli': { configuration: { minimumCompatibleCLIVersion: string } } };

  const profileName = isCI() ? 'amplify-integ-test-user' : 'default';

  const creds = new aws.SharedIniFileCredentials({ profile: profileName });
  aws.config.credentials = creds;

  let region: string;
  let rootStackName: string;
  let cfnClient: CloudFormation;

  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);

    if (!isPackagedAmplifyInPath()) {
      cliPath = resolveRealCLIPath();
      packageJsonPath = path.resolve(cliPath, '..', '..', '..', 'amplify-cli', 'package.json');
      originalPackageJsonContent = fs.readFileSync(packageJsonPath, 'utf8').toString();
      packageJson = JSONUtilities.parse<{ version: string; 'amplify-cli': { configuration: { minimumCompatibleCLIVersion: string } } }>(
        originalPackageJsonContent,
      );
    }
  });

  afterEach(async () => {
    if (projectInitialized) {
      await deleteProject(projRoot);
    }

    deleteProjectDir(projRoot);
  });

  it('test version gating on projects', async () => {
    // We cannot execute this test for packaged CLI as we are modifying the package.json file to
    // simulate multiple versions
    if (isPackagedAmplifyInPath()) {
      return;
    }

    try {
      // Reset version information to make sure tests will pass with future CLI versionsas well
      updateVersionInPackageJson(baseCLIVersion, baseMinimumCLIVersion);

      await initJSProjectWithProfile(projRoot, { name: projName });
      projectInitialized = true;

      const meta = stateManager.getMeta(projRoot);

      region = _.get(meta, ['providers', 'awscloudformation', 'Region']);
      rootStackName = _.get(meta, ['providers', 'awscloudformation', 'StackName']);

      cfnClient = new CloudFormation({ region });

      await expectStackMetadata(baseCLIVersion, baseMinimumCLIVersion);

      // Set CLI version to 100.1.0, verify push succeeds with newer version of CLI
      updateVersionInPackageJson('100.1.0', undefined);

      await push();

      await expectStackMetadata('100.1.0', baseMinimumCLIVersion);

      // Set Minimum CLI version to 100.2.0, verify push succeeds with newer version of CLI
      updateVersionInPackageJson(undefined, '100.2.0');

      await pushFail();

      // Set CLI version to 100.2.0, Minimum CLI version to 100.2.0, verify push succeeds
      updateVersionInPackageJson('100.2.0', '100.2.0');

      await push();

      await expectStackMetadata('100.2.0', '100.2.0');

      // Set CLI version to 100.3.0, Minimum CLI version to 100.2.0, verify push succeeds
      updateVersionInPackageJson('100.3.0', '100.2.0');

      await push();

      await expectStackMetadata('100.3.0', '100.2.0');

      // Set CLI version back to 100.2.0, Minimum CLI version to 100.2.0, verify push succeeds as
      // minimum deploy version requirement has met
      updateVersionInPackageJson('100.2.0', '100.2.0');

      await push();

      await expectStackMetadata('100.2.0', '100.2.0');
    } finally {
      // restore original package.json
      fs.writeFileSync(packageJsonPath, originalPackageJsonContent);
    }
  });

  // Test helper functions
  const push = async () => {
    await amplifyPushForceWithYes(projRoot);
  };

  const pushFail = async () => {
    await amplifyPushForceWithVersionGatingOutput(projRoot);
  };

  const updateVersionInPackageJson = (cliVersion: string | undefined, minimumCompatibleCLIVersion: string | undefined) => {
    if (cliVersion) {
      packageJson.version = cliVersion;
    } else {
      packageJson.version = baseCLIVersion;
    }

    if (minimumCompatibleCLIVersion) {
      packageJson['amplify-cli'].configuration.minimumCompatibleCLIVersion = minimumCompatibleCLIVersion;
    } else {
      packageJson['amplify-cli'].configuration.minimumCompatibleCLIVersion = baseMinimumCLIVersion;
    }

    fs.writeFileSync(packageJsonPath, JSONUtilities.stringify(packageJson));
  };

  const expectStackMetadata = async (deployedByCLIVersion: string, minimumCompatibleCLIVersion: string) => {
    const templateSummary = await cfnClient
      .getTemplateSummary({
        StackName: rootStackName,
      })
      .promise();

    const metadataValue = _.get(templateSummary, ['Metadata']) || '{}';
    const metadata = JSONUtilities.parse(metadataValue);
    const versionGatingMetadata: VersionGatingMetadata = _.get(metadata, ['AmplifyCLI']);

    expect(versionGatingMetadata.DeployedByCLIVersion).toBe(deployedByCLIVersion);
    expect(versionGatingMetadata.MinimumCompatibleCLIVersion).toBe(minimumCompatibleCLIVersion);
  };
});

const resolveRealCLIPath = (): string => {
  const cliPath = getCLIPath(false);
  const cliResolvedPath = which.sync(cliPath);

  return fs.realpathSync(cliResolvedPath);
};

const isPackagedAmplifyInPath = (): boolean => {
  const shebang = '#!/usr/bin/env node';
  const isWin = process.platform.startsWith('win');

  const cliRealPath = resolveRealCLIPath();

  if (isWin) {
    if (cliRealPath.endsWith('.cmd')) {
      return false;
    } else if (cliRealPath.endsWith('.exe')) {
      return true;
    }
  }

  // As *nix have no file extensions, read into the file and look for the shebang
  let fileDescriptor: number | undefined;

  try {
    fileDescriptor = fs.openSync(cliRealPath, 'r');

    const buffer = Buffer.alloc(19);

    fs.readSync(fileDescriptor, buffer, 0, 19, 0);

    const preamble = String(buffer);

    return preamble !== shebang;
  } finally {
    if (fileDescriptor) {
      fs.closeSync(fileDescriptor);
    }
  }
};

const amplifyPushForceWithVersionGatingOutput = (cwd: string, testingWithLatestCodebase: boolean = false): Promise<void> => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push', '--forcePush', '--force', '--yes'], { cwd, stripColors: true })
      .wait('Upgrade to the latest version of Amplify CLI, run: "amplify upgrade" or "npm install -g @aws-amplify/cli')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

const amplifyPushForceWithYes = (cwd: string, testingWithLatestCodebase: boolean = false): Promise<void> => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push', '--forcePush', '--force', '--yes'], { cwd, stripColors: true })
      .wait('All resources are updated in the cloud')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};
