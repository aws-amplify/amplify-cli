import {
  $TSAny,
  $TSContext, AmplifyError, getPackageManager, JSONUtilities, pathManager, ResourceTuple,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import execa from 'execa';
import * as fs from 'fs-extra';
import ora from 'ora';
import * as path from 'path';
import { categoryName, TYPES_DIR_NAME, AMPLIFY_RESOURCES_TYPE_DEF_FILENAME } from './constants';
import { getAllResources } from './dependency-management-utils';
import { generateCloudFormationFromCDK } from './generate-cfn-from-cdk';

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
      await buildResource(resource);
    }
  } catch (err: $TSAny) {
    throw new AmplifyError('InvalidCustomResourceError', {
      message: `There was an error building the custom resources`,
      details: err.message,
      resolution: 'There may be errors in your custom resource file. If so, fix the errors and try again.',
    }, err);
  } finally {
    spinner.stop();
  }
};

const getSelectedResources = async (context: $TSContext, resourceName?: string) :
  Promise<ResourceMeta[]> => (await context.amplify.getResourceStatus(categoryName, resourceName)).allResources as ResourceMeta[];

/**
 *  generates dependent resource type
 */
export const generateDependentResourcesType = async (): Promise<void> => {
  const resourceDirPath = path.join(pathManager.getBackendDirPath(), TYPES_DIR_NAME);
  const target = path.join(resourceDirPath, AMPLIFY_RESOURCES_TYPE_DEF_FILENAME);
  const dependentResourceAttributesFileContent = `export type AmplifyDependentResourcesAttributes = ${JSONUtilities.stringify(getAllResources(), { orderedKeys: true })}`;

  await fs.ensureDir(path.dirname(target));
  await fs.writeFile(target, dependentResourceAttributesFileContent);
};

const buildResource = async (resource: ResourceMeta): Promise<void> => {
  const targetDir = path.resolve(path.join(pathManager.getBackendDirPath(), categoryName, resource.resourceName));

  // generate dynamic types for Amplify resources
  await generateDependentResourcesType();

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
    throw new AmplifyError('MissingOverridesInstallationRequirementsError', {
      message: 'TypeScript executable not found.',
      resolution: 'Please add it as a dev-dependency in the package.json file for this resource.',
    });
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
