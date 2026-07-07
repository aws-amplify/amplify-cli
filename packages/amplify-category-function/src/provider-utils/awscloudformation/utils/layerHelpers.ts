import { $TSAny, $TSContext, $TSMeta, $TSObject, getPackageManager, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import crypto from 'crypto';
import { hashElement, HashElementOptions } from 'folder-hash';
import * as fs from 'fs-extra';
import globby from 'globby';
import { CheckboxQuestion, InputQuestion, ListQuestion, prompt } from 'inquirer';
import _ from 'lodash';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { categoryName } from '../../../constants';
import { cfnTemplateSuffix, LegacyFilename, parametersFileName, provider, ServiceName, versionHash } from './constants';
import { getLayerConfiguration, LayerConfiguration, loadLayerConfigurationFile } from './layerConfiguration';
import { LayerParameters, LayerPermission, LayerRuntime, LayerVersionMetadata, PermissionEnum } from './layerParams';
import { updateLayerArtifacts } from './storeResources';

// These glob patterns cover the resource files Amplify stores in the layer resource's directory,
// layer-parameters.json must NOT be there.
const layerResourceGlobs = [parametersFileName, `*${cfnTemplateSuffix}`];

// File path literals
const libPathName = 'lib';
const optPathName = 'opt';
const packageJson = 'package.json';
const pipfile = 'Pipfile';
const pipfileLock = 'Pipfile.lock';

export interface LayerInputParams {
  layerPermissions?: PermissionEnum[];
  accountIds?: string[];
  orgIds?: string[];
}

export function mapVersionNumberToChoice(layerVersion: LayerVersionMetadata): string {
  return `${layerVersion.Version}: ${layerVersion.Description || '(no description)'}`;
}

export function layerVersionQuestion(versions: string[], message: string, defaultOption?: string): ListQuestion {
  return {
    type: 'list',
    name: 'versionSelection',
    message,
    choices: versions,
    default: defaultOption || 0,
  };
}

export function layerNameQuestion(projectName: string): InputQuestion {
  return {
    type: 'input',
    name: 'layerName',
    message: 'Provide a name for your Lambda layer:',
    validate: (input: string) => {
      input = input.trim();
      const meta = stateManager.getMeta();
      if (!/^[a-zA-Z0-9]{1,87}$/.test(input)) {
        return 'Lambda layer names must be 1-87 alphanumeric characters long.';
      } else if (meta?.function?.input || meta?.function?.[`${projectName}${input}`]) {
        return `A Lambda layer with the name ${input} already exists in this project.`;
      }
      return true;
    },
    default: `layer${uuid().split('-')[0]}`,
  };
}

export function layerPermissionsQuestion(params?: PermissionEnum[]): CheckboxQuestion {
  return {
    type: 'checkbox',
    name: 'layerPermissions',
    message:
      'The current AWS account will always have access to this layer.\nOptionally, configure who else can access this layer. (Hit <Enter> to skip)',
    choices: [
      {
        name: 'Specific AWS accounts',
        value: PermissionEnum.AwsAccounts,
        checked: _.includes(params, PermissionEnum.AwsAccounts),
      },
      {
        name: 'Specific AWS organization',
        value: PermissionEnum.AwsOrg,
        checked: _.includes(params, PermissionEnum.AwsOrg),
      },
      {
        name: 'Public (Anyone on AWS can use this layer)',
        short: 'Public',
        value: PermissionEnum.Public,
        checked: _.includes(params, PermissionEnum.Public),
      },
    ],
    default: [PermissionEnum.Private],
  };
}

export async function layerAccountAccessPrompt(defaultAccountIds?: string[]): Promise<string[]> {
  const hasDefaults = defaultAccountIds && defaultAccountIds.length > 0;
  const answer = await prompt({
    type: 'input',
    name: 'authorizedAccountIds',
    message: 'Provide a list of comma-separated AWS account IDs:',
    validate: (input: string) => {
      const accounts = input.split(',');
      for (const accountId of accounts) {
        if (!/^[0-9]{12}$/.test(accountId.trim())) {
          return `AWS account IDs must be 12 digits long. ${accountId} did not match the criteria.`;
        }
      }
      return true;
    },
    default: hasDefaults ? defaultAccountIds.join(',') : undefined,
  });
  return _.uniq(answer.authorizedAccountIds.split(',').map((accountId: string) => accountId.trim()));
}

export async function layerOrgAccessPrompt(defaultOrgs?: string[]): Promise<string[]> {
  const hasDefaults = defaultOrgs && defaultOrgs.length > 0;
  const answer = await prompt({
    type: 'input',
    name: 'authorizedOrgIds',
    message: 'Provide a list of comma-separated AWS organization IDs:',
    validate: (input: string) => {
      const orgIds = input.split(',');
      for (const orgId of orgIds) {
        if (!/^o-[a-zA-Z0-9]{10,32}$/.test(orgId.trim())) {
          return 'The organization ID starts with "o-" followed by a 10-32 character-long alphanumeric string.';
        }
      }
      return true;
    },
    default: hasDefaults ? defaultOrgs.join(',') : undefined,
  });
  return _.uniq(answer.authorizedOrgIds.split(',').map((orgId: string) => orgId.trim()));
}

export function previousPermissionsQuestion(): ListQuestion {
  return {
    type: 'list',
    name: 'usePreviousPermissions',
    message: 'What permissions do you want to grant to this new layer version?',
    choices: [
      {
        name: 'The same permission as the latest layer version',
        short: 'Previous version permissions',
        value: true,
      },
      {
        name: 'Only accessible by the current account. You can always edit this later with: amplify update function',
        short: 'Private',
        value: false,
      },
    ],
    default: 0,
  };
}

export function layerInputParamsToLayerPermissionArray(parameters: LayerInputParams): LayerPermission[] {
  const { layerPermissions = [] } = parameters;

  if (layerPermissions.filter((p) => p === PermissionEnum.Public).length > 0) {
    return [
      {
        type: PermissionEnum.Public,
      },
    ];
  }

  const permissionObj: Array<LayerPermission> = [];

  layerPermissions.forEach((val) => {
    let obj: LayerPermission;
    if (val === PermissionEnum.Public) {
      obj = {
        type: PermissionEnum.Public,
      };
    } else if (val === PermissionEnum.AwsOrg) {
      obj = {
        type: PermissionEnum.AwsOrg,
        orgs: parameters.orgIds,
      };
    } else if (val === PermissionEnum.AwsAccounts) {
      obj = {
        type: PermissionEnum.AwsAccounts,
        accounts: parameters.accountIds,
      };
    }
    permissionObj.push(obj);
  });

  const privateObj: LayerPermission = {
    type: PermissionEnum.Private,
  };

  permissionObj.push(privateObj); // layer is always accessible by the aws account of the owner

  return permissionObj;
}

export function loadStoredLayerParameters(context: $TSContext, layerName: string): LayerParameters {
  const { permissions, runtimes, description } = getLayerConfiguration(layerName);
  return {
    layerName,
    runtimes,
    permissions,
    providerContext: {
      provider: provider,
      service: ServiceName.LambdaLayer,
      projectName: context.amplify.getProjectDetails().projectConfig.projectName,
    },
    description,
    build: true,
  };
}

export async function isNewVersion(layerName: string) {
  const previousHash = loadPreviousLayerHash(layerName);
  const currentHash = await hashLayerVersion(pathManager.getResourceDirectoryPath(undefined, categoryName, layerName), layerName);

  return previousHash !== currentHash;
}

export function isMultiEnvLayer(layerName: string) {
  const layerParametersPath = path.join(
    pathManager.getResourceDirectoryPath(undefined, categoryName, layerName),
    LegacyFilename.layerParameters,
  );

  if (fs.existsSync(layerParametersPath)) {
    return false;
  }

  const layerConfiguration = loadLayerConfigurationFile(layerName, false);
  if (layerConfiguration?.nonMultiEnv) {
    return false;
  }

  return true;
}

export function getLayerName(context: $TSContext, layerName: string): string {
  const { envName }: { envName: string } = context.amplify.getEnvInfo();

  return isMultiEnvLayer(layerName) ? `${layerName}-${envName}` : layerName;
}

export function getLambdaFunctionsDependentOnLayerFromMeta(layerName: string, meta: $TSMeta) {
  return Object.entries(meta[categoryName]).filter(
    ([, lambdaFunction]: [string, $TSObject]) =>
      lambdaFunction.service === ServiceName.LambdaFunction &&
      lambdaFunction?.dependsOn?.filter((dependency) => dependency.resourceName === layerName).length > 0,
  );
}

// Check hash results for content changes, bump version if so
export async function ensureLayerVersion(context: $TSContext, layerName: string, previousHash?: string) {
  const currentHash = await hashLayerVersion(pathManager.getResourceDirectoryPath(undefined, categoryName, layerName), layerName);

  if (previousHash && previousHash !== currentHash) {
    context.print.success(`Content changes in Lambda layer ${layerName} detected.`);
  }

  const layerParameters = loadStoredLayerParameters(context, layerName);

  await updateLayerArtifacts(context, layerParameters, { updateLayerParams: false, generateCfnFile: true, updateDescription: false });

  return currentHash;
}

export function loadPreviousLayerHash(layerName: string): string | undefined {
  const meta: $TSMeta = stateManager.getMeta();
  const previousHash = _.get(meta, [categoryName, layerName, versionHash], undefined);

  return previousHash;
}

// hashes all of the layer contents as well as the files in the layer path (CFN, parameters, etc)
export const hashLayerResource = async (layerPath: string, resourceName: string): Promise<string> => {
  return await hashLayerVersion(layerPath, resourceName, true);
};

export async function getChangedResources(resources: Array<$TSAny>): Promise<Array<$TSAny>> {
  const checkLambdaLayerChanges = async (resource: $TSAny): Promise<boolean> => {
    const { resourceName } = resource;
    const previousHash = loadPreviousLayerHash(resourceName);

    if (!previousHash) {
      return true;
    }

    const currentHash = await hashLayerVersion(pathManager.getResourceDirectoryPath(undefined, categoryName, resourceName), resourceName);

    return currentHash !== previousHash;
  };

  const resourceCheck = await Promise.all(resources.map(checkLambdaLayerChanges));

  return resources.filter((_, i) => resourceCheck[i]);
}

const getLayerGlobs = async (
  resourcePath: string,
  resourceName: string,
  runtimes: LayerRuntime[],
  includeResourceFiles: boolean,
): Promise<string[]> => {
  const result: string[] = [];

  if (includeResourceFiles) {
    result.push(...layerResourceGlobs);
  }

  // Add to hashable files/folders
  result.push(optPathName);

  for (const runtime of runtimes) {
    const { value: runtimeId, layerExecutablePath } = runtime;
    let layerCodePath: string;

    if (layerExecutablePath !== undefined) {
      layerCodePath = path.join(resourcePath, libPathName, layerExecutablePath);
    }

    //TODO let function runtimes export globs later instead of hardcoding in here
    if (runtimeId === 'nodejs') {
      const packageManager = await getPackageManager(layerCodePath);

      // If no packagemanager was detected it means no package.json present at the resource path,
      // so no files to hash related to packages.
      if (packageManager !== null) {
        // Add to hashable files/folders
        result.push(path.join(libPathName, layerExecutablePath, packageJson));

        // If lock file is present, add to hashable files/folders
        const lockFilePath = path.join(layerCodePath, packageManager.lockFile);

        if (fs.existsSync(lockFilePath)) {
          result.push(path.join(libPathName, layerExecutablePath, packageManager.lockFile));
        }
      }

      // Add layer direct content from lib/nodejs and exclude well known files from list.
      // files must be relative to resource folder as that will be used as a base path for hashing.
      const contentFilePaths = await globby([path.join(libPathName, layerExecutablePath, '**', '*')], {
        cwd: resourcePath,
        ignore: ['node_modules', packageJson, 'yarn.lock', 'package-lock.json'].map((name) =>
          path.join(libPathName, layerExecutablePath, name),
        ),
      });

      result.push(...contentFilePaths);
    } else if (runtimeId === 'python') {
      // Add to hashable files/folders
      const pipfileFilePath = path.join(layerCodePath, pipfile);

      if (fs.existsSync(pipfileFilePath)) {
        result.push(path.join(libPathName, layerExecutablePath, pipfile));
      }

      // If lock file is present, add to hashable files/folders
      const pipfileLockFilePath = path.join(layerCodePath, pipfileLock);

      if (fs.existsSync(pipfileLockFilePath)) {
        result.push(path.join(libPathName, layerExecutablePath, pipfileLock));
      }

      // Add layer direct content from lib/python and exclude well known files from list.
      // files must be relative to resource folder as that will be used as a base path for hashing.
      const contentFilePaths = await globby([path.join(libPathName, layerExecutablePath, '**', '*')], {
        cwd: resourcePath,
        ignore: ['lib', pipfile, pipfileLock].map((name) => path.join(libPathName, layerExecutablePath, name)),
      });

      result.push(...contentFilePaths);
    } else if (runtimeId !== undefined) {
      const error = new Error(`Unsupported layer runtime: ${runtimeId} for resource: ${resourceName}`);
      error.stack = undefined;

      throw error;
    }
  }

  return result;
};

// hashes just the content that will be zipped into the layer version.
// for efficiency, it only hashes package.json files in the node_modules folder of nodejs layers
const hashLayerVersion = async (layerPath: string, layerName: string, includeResourceFiles = false): Promise<string> => {
  const layerConfig: LayerConfiguration = loadLayerConfigurationFile(layerName, false);

  if (layerConfig) {
    const layerFilePaths = await getLayerGlobs(layerPath, layerName, layerConfig.runtimes, includeResourceFiles);

    const filePaths = await globby(layerFilePaths, { cwd: layerPath });

    // Sort the globbed files to make sure subsequent hashing on the same set of files will be ending
    // up in the same hash
    filePaths.sort();

    return filePaths
      .map((filePath) => fs.readFileSync(path.join(layerPath, filePath), 'binary'))
      .reduce((acc, it) => acc.update(it), crypto.createHash('sha256'))
      .digest('hex');
  } else {
    // Do legacy hashing
    return includeResourceFiles ? await legacyResourceHashing(layerPath) : await legacyContentHashing(layerPath);
  }
};

// hashes just the content that will be zipped into the layer version.
// for efficiency, it only hashes package.json files in the node_modules folder of nodejs layers
const legacyContentHashing = async (layerPath: string): Promise<string> => {
  // wrapper around hashElement that will return an empty string if the path does not exist
  const safeHash = async (path: string, opts?: HashElementOptions): Promise<string> => {
    if (fs.pathExistsSync(path)) {
      return (
        await hashElement(path, opts).catch(() => {
          throw new Error(`An error occurred hashing directory ${path}`);
        })
      ).hash;
    }

    return '';
  };

  const nodePath = path.join(layerPath, libPathName, 'nodejs');
  const nodeHashOptions = {
    files: {
      include: [packageJson],
    },
  };
  const pyPath = path.join(layerPath, libPathName, 'python');
  const optPath = path.join(layerPath, optPathName);

  const joinedHashes = (await Promise.all([safeHash(nodePath, nodeHashOptions), safeHash(pyPath), safeHash(optPath)])).join();

  return crypto.createHash('sha256').update(joinedHashes).digest('base64');
};

const legacyResourceHashing = async (layerPath: string): Promise<string> => {
  const files = await globby(layerResourceGlobs, { cwd: layerPath });

  const hash = files
    .map((filePath) => fs.readFileSync(path.join(layerPath, filePath), 'utf8'))
    .reduce((acc, it) => acc.update(it), crypto.createHash('sha256'))
    .update(await legacyContentHashing(layerPath))
    .digest('base64');

  return hash;
};
