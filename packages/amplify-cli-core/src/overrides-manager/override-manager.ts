import { formatter, printer, prompter } from 'amplify-prompts';
import execa from 'execa';
import * as fs from 'fs-extra';
import { EOL } from 'os';
import * as path from 'path';
import * as vm from 'vm2';
import {
  $TSContext, $TSAny, getPackageManager, pathManager, JSONUtilities,
} from '..';

/**
 * Build and execute override.ts file for a category resource
 *
 * @param categoryName string
 * @param resourceName string
 * @param resourceTemplateObj CloudFormation template object with generic type T
 */
export const applyCategoryOverride = async <T>(categoryName: string, resourceName: string, resourceTemplateObj: T): Promise<void> => {
  const backendDir = pathManager.getBackendDirPath();
  const resourceDir = pathManager.getResourceDirectoryPath(undefined, categoryName, resourceName);
  const overrideJsFilePath = path.join(resourceDir, 'build', 'override.js');
  const errorMessageArray = ['No override file found', `To override ${resourceName} run "amplify override ${categoryName}"`];

  return applyOverride<T>(backendDir, overrideJsFilePath, resourceTemplateObj, () => formatter.list(errorMessageArray));
};

/**
 * Build and execute override.ts file
 *
 * @param buildDirPath directory where override package.json lives
 * @param overrideJsFilePath Destination path of override build artifact
 * @param resourceTemplateObj CloudFormation template object with generic type T
 * @param overrideFileNotFoundErrorHandler Callback to determine what to do if override file cannot be found
 */
export const applyOverride = async <T>(
  buildDirPath: string,
  overrideJsFilePath: string,
  resourceTemplateObj: T,
  overrideFileNotFoundErrorHandler: (error?: $TSAny) => void,
): Promise<void> => {
  const isBuild = await buildOverrideDir(buildDirPath, overrideJsFilePath);

  // skip if packageManager or override.ts not found
  if (!isBuild) {
    return;
  }
  let override;
  try {
    ({ override } = await import(overrideJsFilePath));
  } catch {
    overrideFileNotFoundErrorHandler();
    return;
  }
  if (!override || typeof override !== 'function') {
    return;
  }

  let overrideCode: string;
  try {
    overrideCode = await fs.readFile(overrideJsFilePath, 'utf-8');
  } catch (error) {
    overrideFileNotFoundErrorHandler();
    return;
  }

  const sandboxNode = new vm.NodeVM({
    console: 'inherit',
    timeout: 5000,
    sandbox: {},
    require: {
      context: 'sandbox',
      builtin: ['path'],
      external: true,
    },
  });

  await sandboxNode.run(overrideCode, overrideJsFilePath).override(resourceTemplateObj as T);
};

/**
 * Build override directory, generates package.json and tsconfig.json if none exist
 * @param cwd directory path where override package.json lives
 * @param destDirPath destination directory path of override build artifact
 *
 */
export const buildOverrideDir = async (cwd: string, destDirPath: string): Promise<boolean> => {
  const overrideFileName = path.join(destDirPath, 'override.ts');
  if (!fs.existsSync(overrideFileName)) {
    // return when no override file found
    return false;
  }

  const overridesResourcesPath = path.join(__dirname, '..', '..', 'resources', 'overrides-resource');
  const backendPath = pathManager.getBackendDirPath();

  const overrideBackendPackageJson = path.join(backendPath, 'package.json');
  if (!fs.existsSync(overrideBackendPackageJson)) {
    const overrideSamplePackageJsonPath = path.join(overridesResourcesPath, 'package.json');
    fs.writeFileSync(overrideBackendPackageJson, fs.readFileSync(overrideSamplePackageJsonPath));
  }

  const overrideBackendTsConfigJson = path.join(backendPath, 'tsconfig.json');
  if (!fs.existsSync(overrideBackendTsConfigJson)) {
    const overrideSampleTsconfigJsonPath = path.join(overridesResourcesPath, 'tsconfig.json');
    fs.writeFileSync(overrideBackendTsConfigJson, fs.readFileSync(overrideSampleTsconfigJsonPath));
  }
  const packageManager = getPackageManager(cwd);

  if (packageManager === null) {
    throw new Error('No package manager found. Please install npm or yarn to compile overrides for this project.');
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
    const tsConfigSampleFilePath = path.join(overridesResourcesPath, 'tsconfig.resource.json');
    fs.writeFileSync(tsConfigDestFilePath, fs.readFileSync(tsConfigSampleFilePath));

    // get locally installed tsc executable

    const localTscExecutablePath = path.join(cwd, 'node_modules', '.bin', 'tsc');

    if (!fs.existsSync(localTscExecutablePath)) {
      throw new Error('Typescript executable not found. Please add it as a dev-dependency in the package.json file for this resource.');
    }
    execa.sync(localTscExecutablePath, ['--project', `${tsConfigDestFilePath}`], {
      cwd: tsConfigDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    return true;
  } catch (error: $TSAny) {
    if (error.code === 'ENOENT') {
      throw new Error(`Packaging overrides failed. Could not find ${packageManager} executable in the PATH.`);
    } else {
      throw new Error(`Packaging overrides failed with the error:${EOL}${error.message}`);
    }
  }
};

/**
 * generates boilerplate for override
 *
 * @param context context object
 * @param srcResourceDirPath source
 * @param destDirPath destination
 * @returns Promise<void>
 */
export const generateOverrideSkeleton = async (context: $TSContext, srcResourceDirPath: string, destDirPath: string): Promise<void> => {
  // 1. Create skeleton package
  const backendDir = pathManager.getBackendDirPath();
  const overrideFile = path.join(destDirPath, 'override.ts');
  if (fs.existsSync(overrideFile)) {
    await context.amplify.openEditor(context, overrideFile);
    return;
  }
  // add tsconfig and package.json to amplify/backend
  generateAmplifyOverrideProjectBuildFiles(backendDir, srcResourceDirPath);

  fs.ensureDirSync(destDirPath);

  // add overrde.ts and tsconfig<project> to build folder of the resource / rootstack
  generateTsConfigForProject(srcResourceDirPath, destDirPath);

  // 2. Build Override Directory
  await buildOverrideDir(backendDir, destDirPath);

  printer.success(`Successfully generated "override.ts" folder at ${destDirPath}`);
  const isOpen = await prompter.yesOrNo('Do you want to edit override.ts file now?', true);
  if (isOpen) {
    await context.amplify.openEditor(context, overrideFile);
  }
};

/**
 * generate package.json and tsconfig.json files
 */
export const generateAmplifyOverrideProjectBuildFiles = (backendDir: string, srcResourceDirPath: string): void => {
  const packageJSONFilePath = path.join(backendDir, 'package.json');
  const tsConfigFilePath = path.join(backendDir, 'tsconfig.json');
  // add package.json to amplify backend
  if (!fs.existsSync(packageJSONFilePath)) {
    const packageJson = JSONUtilities.readJson(path.join(srcResourceDirPath, 'package.json'));
    JSONUtilities.writeJson(packageJSONFilePath, packageJson);
  }

  // add tsconfig.json to amplify backend
  if (!fs.existsSync(tsConfigFilePath)) {
    const tsConfigJson = JSONUtilities.readJson(path.join(srcResourceDirPath, 'tsconfig.json'));
    JSONUtilities.writeJson(tsConfigFilePath, tsConfigJson);
  }
};

/**
 * generates override.ts, tsconfig.json, and tsconfig.resource.json files for project
 */
const generateTsConfigForProject = (srcResourceDirPath: string, destDirPath: string): void => {
  const overrideFileName = path.join(destDirPath, 'override.ts');
  // ensure build dir path
  fs.ensureDirSync(path.join(destDirPath, 'build'));
  const resourceTsConfigFileName = path.join(destDirPath, 'build', 'tsconfig.resource.json');
  fs.writeFileSync(overrideFileName, fs.readFileSync(path.join(srcResourceDirPath, 'override.ts.sample')));
  fs.writeFileSync(resourceTsConfigFileName, fs.readFileSync(path.join(srcResourceDirPath, 'tsconfig.resource.json')));
};
