import {
  $TSAny,
  $TSContext, getPackageManager, pathManager, ResourceTuple,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import execa from 'execa';
import * as fs from 'fs-extra';
import ora from 'ora';
import * as path from 'path';
import { categoryName, TYPES_DIR_NAME, AMPLIFY_RESOURCES_TYPE_DEF_FILENAME } from './constants';
import { getAllResources } from './dependency-management-utils';
import { generateCloudFormationFromCDK } from './generate-cfn-from-cdk';

const resourcesDirRoot = path.normalize(path.join(__dirname, '../../resources'));
const amplifyDependentResourcesFilename = 'amplify-dependent-resources-ref.ejs';

type ResourceMeta = ResourceTuple & {
  service: string;
  build: boolean;
};
/**
 * builds custom resources
 * @param context object
 * @param resourceName resource name to build
 */
export const buildCustomResources = async (context: $TSContext, resourceName?: string): Promise<void> => {
  const spinner = ora('Building custom resources');
  try {
    spinner.start();

    const resourcesToBuild = (await getSelectedResources(context, resourceName)).filter(resource => resource.service === 'customCDK');
    for await (const resource of resourcesToBuild) {
      await buildResource(context, resource);
    }
  } catch (err: $TSAny) {
    printer.error('There was an error building the custom resources');
    printer.error(err.stack);
    spinner.stop();
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  spinner.stop();
};

const getSelectedResources = async (context: $TSContext, resourceName?: string) :
  Promise<ResourceMeta[]> => (await context.amplify.getResourceStatus(categoryName, resourceName)).allResources as ResourceMeta[];

/**
 *  generates dependent resource type
 * @param context object
 */
export const generateDependentResourcesType = async (context: $TSContext): Promise<void> => {
  const resourceDirPath = path.join(pathManager.getBackendDirPath(), TYPES_DIR_NAME);

  const copyJobs = [
    {
      dir: resourcesDirRoot,
      template: amplifyDependentResourcesFilename,
      target: path.join(resourceDirPath, AMPLIFY_RESOURCES_TYPE_DEF_FILENAME),
    },
  ];

  const allResources = getAllResources();

  const params = {
    dependentResourcesType: allResources,
  };

  await context.amplify.copyBatch(context, copyJobs, params, true);
};

const buildResource = async (context: $TSContext, resource: ResourceMeta): Promise<void> => {
  const targetDir = path.resolve(path.join(pathManager.getBackendDirPath(), categoryName, resource.resourceName));

  // generate dynamic types for Amplify resources
  await generateDependentResourcesType(context);

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
  } catch (error: $TSAny) {
    if ((error as $TSAny).code === 'ENOENT') {
      throw new Error(`Packaging overrides failed. Could not find ${packageManager} executable in the PATH.`);
    } else {
      throw new Error(`Packaging overrides failed with the error \n${error.message}`);
    }
  }

  // get locally installed tsc executable

  const localTscExecutablePath = path.join(targetDir, 'node_modules', '.bin', 'tsc');

  if (!fs.existsSync(localTscExecutablePath)) {
    throw new Error('Typescript executable not found. Please add it as a dev-dependency in the package.json file for this resource.');
  }

  try {
    execa.sync(localTscExecutablePath, {
      cwd: targetDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
  } catch (error: $TSAny) {
    printer.error(`Failed building resource ${resource.resourceName}`);
    throw error;
  }

  await generateCloudFormationFromCDK(resource.resourceName);
};
