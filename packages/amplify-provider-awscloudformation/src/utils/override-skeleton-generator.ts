import path from 'path';
import fs from 'fs-extra';
import { getPackageManager } from 'amplify-cli-core';
import execa from 'execa';

export const generateOverrideSkeleton = async (context: any): Promise<void> => {
  let projectPath;
  ({ projectPath } = context.amplify.getEnvInfo());

  // 1. Create skeleton package

  const overrideDirPath = path.join(projectPath, 'amplify', 'backend', 'awscloudformation', 'overrides');

  /*if(fs.existsSync(overrideDirPath)) {
        context.print.warning(`Overrides folder already exists. Please make your changes in ${overrideDirPath} directory`);
        return;
    }*/

  fs.ensureDirSync(overrideDirPath);
  const overrideResourceDir = path.join(__dirname, '../../', 'resources', 'overrides-resource');
  fs.copySync(overrideResourceDir, overrideDirPath);

  // 2. Build Override Directory

  buildOverrideDir(overrideDirPath, context);
};

function buildOverrideDir(cwd: string, context: any) {
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

  // 3. run tsc build

  execa.sync('tsc', [], {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
}
