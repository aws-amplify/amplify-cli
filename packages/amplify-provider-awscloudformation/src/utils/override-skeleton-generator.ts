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


    // 2. run npm/yarn install

    const packageManager = getPackageManager(overrideResourceDir );

    if (packageManager === null) {
      // If no package manager was detected, it means that this functions or layer has no package.json, so no package operations
      // should be done.
      return;
    }
  
    const useYarn = packageManager.packageManager === 'yarn';
    const args = toPackageManagerArgs(useYarn);
    try {
      execa.sync(packageManager.executable, args);

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error(`Packaging overrides failed. Could not find ${packageManager} executable in the PATH.`);
      } else {
        throw new Error(`Packaging overridesfailed with the error \n${error.message}`);
      }
    }

    // 3. run tsc build

    execa.sync('tsc');


};

function toPackageManagerArgs(useYarn: boolean, scriptName?: string) {
    if (scriptName) {
      return useYarn ? [scriptName] : ['run-script', scriptName];
    }
    return useYarn ? [] : ['install'];
  }
  