import { $TSContext, ResourceTuple, pathManager, getPackageManager, JSONUtilities } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import execa from 'execa';
import path from 'path';
import * as cdk from '@aws-cdk/core';
import ora from 'ora';

type ResourceMeta = ResourceTuple & {
  service: string;
  build: boolean;
};

export async function buildCustomResources(context: $TSContext, resourceName?: string) {
  const spinner = ora('Building custom resources');
  try {
    spinner.start();
    const resourcesToBuild = (await getSelectedResources(context, resourceName)).filter(resource => resource.service === 'customCDK');
    for await (const resource of resourcesToBuild) {
      await buildResource(context, resource);
    }
  } catch (err: any) {
    printer.error('There was an error building the custom resources');
    printer.error(err.stack);
    spinner.stop();
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  spinner.stop();
}

const getSelectedResources = async (context: $TSContext, resourceName?: string) => {
  return (await context.amplify.getResourceStatus('custom', resourceName)).allResources as ResourceMeta[];
};

async function buildResource(context: $TSContext, resource: ResourceMeta) {
  const targetDir = path.resolve(path.join(pathManager.getBackendDirPath(), 'custom', resource.resourceName));
  const packageManager = getPackageManager(targetDir);

  if (packageManager === null) {
    throw new Error('No package manager found. Please install npm or yarn to compile overrides for this project.');
  }

  try {
    execa.sync(packageManager.executable, ['install'], {
      cwd: targetDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error: any) {
    if ((error as any).code === 'ENOENT') {
      throw new Error(`Packaging overrides failed. Could not find ${packageManager} executable in the PATH.`);
    } else {
      throw new Error(`Packaging overrides failed with the error \n${error.message}`);
    }
  }

  try {
    execa.sync('tsc', {
      cwd: targetDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error: any) {
    printer.error(`Failed building resource ${resource.resourceName}`);
    throw error;
  }

  await generateCloudFormationFromCDK(resource.resourceName);
}

async function generateCloudFormationFromCDK(resourceName: string) {
  const targetDir = path.join(pathManager.getBackendDirPath(), 'custom', resourceName);
  const { cdkStack } = require(path.resolve(path.join(targetDir, 'build', 'cdk-stack.js')));

  const customStack: cdk.Stack = new cdkStack(undefined, undefined, undefined, { category: 'custom', resourceName });

  // @ts-ignore
  JSONUtilities.writeJson(path.join(targetDir, 'build', 'cloudformation-template.json'), customStack._toCloudFormation());
}
