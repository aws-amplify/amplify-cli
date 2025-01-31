import { printer, prompter } from '@aws-amplify/amplify-prompts';
import execa from 'execa';
import * as fs from 'fs-extra';
import * as path from 'path';
import { $TSContext, AmplifyError, getPackageManager, pathManager, skipHooks, stateManager } from '../index';
import { JSONUtilities } from '../jsonUtilities';
import { merge } from 'lodash';

/**
 * This method generates the default/template overrides file
 */
export const generateOverrideSkeleton = async (context: $TSContext, srcResourceDirPath: string, destDirPath: string): Promise<void> => {
  // 1. Create skeleton package
  const backendDir = pathManager.getBackendDirPath();
  const overrideFile = path.join(destDirPath, 'override.ts');
  if (fs.existsSync(overrideFile)) {
    await context.amplify.openEditor(context, overrideFile);
    return;
  }
  // add tsConfig and package.json to amplify/backend
  generateAmplifyOverrideProjectBuildFiles(backendDir, srcResourceDirPath);

  fs.ensureDirSync(destDirPath);

  // add overrde.ts and tsconfig<project> to build folder of the resource / rootstack
  // eslint-disable-next-line spellcheck/spell-checker
  generateTsConfigforProject(srcResourceDirPath, destDirPath);

  // 2. Build Override Directory
  await buildOverrideDir(backendDir, destDirPath);

  printer.success(`Successfully generated "override.ts" folder at ${destDirPath}`);
  const isOpen = await prompter.yesOrNo('Do you want to edit override.ts file now?', true);
  if (isOpen) {
    await context.amplify.openEditor(context, overrideFile);
  }
};

/**
 * Returns true if a Typescript overrides file is found, and compiled successfully into an overrides.js file.
 * Returns false if no Typescript overrides file is found.
 *
 * Throws if a Typescript overrides file is found, but does not compile.
 */
export const buildOverrideDir = async (cwd: string, destDirPath: string): Promise<boolean> => {
  const overrideFileName = path.join(destDirPath, 'override.ts');
  if (!fs.existsSync(overrideFileName)) {
    // return when no override file found
    return false;
  }
  if (skipHooks()) {
    throw new AmplifyError('ScriptingFeaturesDisabledError', {
      message: 'A flag to disable overrides has been detected, please deploy from a different environment.',
    });
  }
  const overrideBackendPackageJson = path.join(pathManager.getBackendDirPath(), 'package.json');
  if (!fs.existsSync(overrideBackendPackageJson)) {
    const overrideSamplePackageJsonPath = path.join(__dirname, '..', '..', 'resources', 'overrides-resource', 'package.json');
    fs.writeFileSync(overrideBackendPackageJson, fs.readFileSync(overrideSamplePackageJsonPath));
  }

  const overrideBackendTsConfigJson = path.join(pathManager.getBackendDirPath(), 'tsconfig.json');
  if (!fs.existsSync(overrideBackendTsConfigJson)) {
    const overrideSampleTsconfigJsonPath = path.join(__dirname, '..', '..', 'resources', 'overrides-resource', 'tsconfig.json');
    fs.writeFileSync(overrideBackendTsConfigJson, fs.readFileSync(overrideSampleTsconfigJsonPath));
  }

  // ensure awscloudformation folder is not excluded in vscode
  setSettingsJsonAwscloudformationFlagFalse();

  const packageManager = await getPackageManager(cwd);

  if (packageManager === null) {
    throw new AmplifyError('MissingOverridesInstallationRequirementsError', {
      message: 'No package manager found.',
      resolution: 'Please install npm or yarn to compile overrides for this project.',
    });
  }

  try {
    execa.sync(packageManager.executable, ['install'], {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    // run tsc build to build override.ts file
    const tsConfigDir = path.join(destDirPath, 'build');

    // making sure build folder exists for resource
    fs.ensureDirSync(tsConfigDir);
    // add overrde.ts and tsconfig<project> to build folder of the resource / rootstack
    const tsConfigDestFilePath = path.join(tsConfigDir, 'tsconfig.resource.json');
    const tsConfigSampleFilePath = path.join(__dirname, '..', '..', 'resources', 'overrides-resource', 'tsconfig.resource.json');
    fs.writeFileSync(tsConfigDestFilePath, fs.readFileSync(tsConfigSampleFilePath));

    // get locally installed tsc executable

    const localTscExecutablePath = path.join(cwd, 'node_modules', '.bin', 'tsc');

    if (!fs.existsSync(localTscExecutablePath)) {
      throw new AmplifyError('MissingOverridesInstallationRequirementsError', {
        message: 'TypeScript executable not found.',
        resolution: 'Please add it as a dev-dependency in the package.json file for this resource.',
      });
    }
    execa.sync(localTscExecutablePath, [`--project`, `${tsConfigDestFilePath}`], {
      cwd: tsConfigDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AmplifyError('MissingOverridesInstallationRequirementsError', {
        message: `Packaging overrides failed. Could not find ${packageManager} executable in the PATH.`,
      });
    } else {
      throw new AmplifyError(
        'InvalidOverrideError',
        {
          message: `Packaging overrides failed.`,
          details: error.message,
          resolution: 'There may be errors in your overrides file. If so, fix the errors and try again.',
        },
        error,
      );
    }
  }
};

/**
 * this method adds the package.json & tsconfig.json files needed for overrides
 */
export const generateAmplifyOverrideProjectBuildFiles = (backendDir: string, srcResourceDirPath: string): void => {
  const packageJSONFilePath = path.join(backendDir, 'package.json');
  const tsConfigFilePath = path.join(backendDir, 'tsconfig.json');
  // add package.json to amplify backend
  if (!fs.existsSync(packageJSONFilePath)) {
    const packageJson = JSONUtilities.readJson(path.join(srcResourceDirPath, 'package.json'));
    JSONUtilities.writeJson(packageJSONFilePath, packageJson);
  }

  // add tsConfig.json to amplify backend
  if (!fs.existsSync(tsConfigFilePath)) {
    const tsConfigJson = JSONUtilities.readJson(path.join(srcResourceDirPath, 'tsconfig.json'));
    JSONUtilities.writeJson(tsConfigFilePath, tsConfigJson);
  }
};

/**
 * this method generates the tsconfig file template for overrides
 */
// eslint-disable-next-line spellcheck/spell-checker
export const generateTsConfigforProject = (srcResourceDirPath: string, destDirPath: string): void => {
  const overrideFileName = path.join(destDirPath, 'override.ts');
  // ensure build dir path
  fs.ensureDirSync(path.join(destDirPath, 'build'));
  const resourceTsConfigFileName = path.join(destDirPath, 'build', 'tsconfig.resource.json');
  fs.writeFileSync(overrideFileName, fs.readFileSync(path.join(srcResourceDirPath, 'override.ts.sample')));
  fs.writeFileSync(resourceTsConfigFileName, fs.readFileSync(path.join(srcResourceDirPath, 'tsconfig.resource.json')));
};

/**
 * this method sets the flag to false in vscode settings.json to show awscloudformation folder in vscode
 */
const setSettingsJsonAwscloudformationFlagFalse = (): void => {
  if (stateManager.getLocalEnvInfo().defaultEditor !== 'vscode') {
    return;
  }

  const workspaceSettingsPath = '.vscode/settings.json';
  const exclusionRules = {
    'files.exclude': {
      'amplify/backend/awscloudformation': false,
    },
  };

  try {
    // if settings file exists, safely add exclude settings to it
    const settings = JSONUtilities.readJson(workspaceSettingsPath);
    JSONUtilities.writeJson(workspaceSettingsPath, merge(settings, exclusionRules));
  } catch (error) {
    // workspace settings file does not exist, noop
  }
};
