import fs from 'fs-extra';
import { $TSContext, getPackageManager } from '../index';
import execa from 'execa';
import * as path from 'path';
import { printer } from 'amplify-prompts';
import { JSONUtilities } from '../jsonUtilities';

export const generateOverrideSkeleton = async (context: $TSContext, srcResourceDirPath: string, destDirPath: string): Promise<void> => {
  // 1. Create skeleton package
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const overrideFile = path.join(destDirPath, 'override.ts');
  if (fs.existsSync(overrideFile)) {
    await context.amplify.openEditor(context, overrideFile);
    return;
  }
  // add tsConfig and package.json to amplify/backend
  generateAmplifyOverrideProjectBuildFiles(backendDir, srcResourceDirPath);

  fs.ensureDirSync(destDirPath);

  // add overrde.ts and tsconfig<project> to build folder of the resource / rootstack
  generateTsConfigforProject(backendDir, srcResourceDirPath, destDirPath);

  // 2. Build Override Directory
  await buildOverrideDir(backendDir, destDirPath);

  printer.success(`Successfully generated "override.ts" folder at ${destDirPath}`);
  await context.amplify.openEditor(context, overrideFile);
};

export async function buildOverrideDir(cwd: string, destDirPath: string) {
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
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      throw new Error(`Packaging overrides failed. Could not find ${packageManager} executable in the PATH.`);
    } else {
      throw new Error(`Packaging overrides failed with the error \n${error.message}`);
    }
  }

  // run tsc build to build override.ts file
  const tsConfigDir = path.join(destDirPath, 'build');
  const tsConfigFilePath = path.join(tsConfigDir, 'tsconfig.resource.json');
  execa.sync('tsc', [`--project`, `${tsConfigFilePath}`], {
    cwd: tsConfigDir,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
}

export const generateAmplifyOverrideProjectBuildFiles = (backendDir: string, srcResourceDirPath: string) => {
  const packageJSONFilePath = path.join(backendDir, 'package.json');
  const tsConfigFilePath = path.join(backendDir, 'tsconfig.json');
  // add package.json to amplofy backend
  if (!fs.existsSync(packageJSONFilePath)) {
    JSONUtilities.writeJson(packageJSONFilePath, JSONUtilities.readJson(path.join(srcResourceDirPath, 'package.json')));
  }

  // add tsConfig.json to amplify backend
  if (!fs.existsSync(tsConfigFilePath)) {
    JSONUtilities.writeJson(tsConfigFilePath, JSONUtilities.readJson(path.join(srcResourceDirPath, 'tsconfig.json')));
  }
};

export const generateTsConfigforProject = (backendDir: string, srcResourceDirPath: string, destDirPath: string) => {
  const overrideFileName = path.join(destDirPath, 'override.ts');
  const resourceTsConfigFileName = path.join(destDirPath, 'build', 'tsconfig.resource.json');
  fs.writeFileSync(overrideFileName, fs.readFileSync(path.join(srcResourceDirPath, 'override.ts')));
  fs.writeFileSync(resourceTsConfigFileName, fs.readFileSync(path.join(srcResourceDirPath, 'tsconfig.resource.json')));
};
