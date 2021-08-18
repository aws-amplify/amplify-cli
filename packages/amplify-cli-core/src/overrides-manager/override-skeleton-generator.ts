import fs from 'fs-extra';
import { getPackageManager } from '../index';
import execa from 'execa';
import { $TSContext } from '../index';

export const generateOverrideSkeleton = async (context: $TSContext, srcResourceDirPath: string, destDirPath: string): Promise<void> => {
  // 1. Create skeleton package
  const backendDir = context.amplify.pathManager.getBackendDirPath();

  if (fs.existsSync(destDirPath)) {
    context.print.warning(`Overrides folder already exists. Please make your changes in ${destDirPath} directory`);
    return;
  }

  fs.ensureDirSync(destDirPath);

  fs.copySync(srcResourceDirPath, destDirPath);

  // 2. Build Override Directory

  await buildOverrideDir(destDirPath);
};

export async function buildOverrideDir(cwd: string) {
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

  execa.sync('tsc', [], {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
}
